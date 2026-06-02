import { streamText, stepCountIs, type LanguageModel, type ModelMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { ALL_TOOLS } from './agentTools';
import { getSystemPrompt } from './agentKnowledge';
import type { AgentApiConfig } from './agentApiConfig';

interface AgentLoopInput {
  apiConfig: AgentApiConfig;
  messages: ModelMessage[];
  signal?: AbortSignal;
  onTextDelta?: (delta: string) => void;
  onToolCallStart?: (toolCallId: string, toolName: string, input: unknown) => void;
  onToolCallResult?: (toolCallId: string, result: unknown) => void;
}

interface AgentLoopOutput {
  text: string;
  steps?: number;
}

const MAX_STEPS = 10;
const STEP_COMPRESS_THRESHOLD = 15;
const SESSION_COMPACT_THRESHOLD = 30;

/** 关闭流式：与 DeepSeek 官方 `stream: false` 一致，走一次性 chat/completions */
const AGENT_USE_STREAMING = true;

/** 清理 base URL：去掉尾部斜杠和常见的非 base 路径后缀 */
function cleanBaseURL(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  // 去掉 /anthropic /v1 /chat/completions /messages /v1/chat/completions 等后缀
  url = url.replace(/\/(anthropic|v1(\/chat\/completions)?|chat\/completions|messages)$/i, '');
  return url;
}

/** 任何 deepseek 域名的 URL 都视为 DeepSeek，包括 /anthropic 端点 */
function isDeepSeekHost(baseURL: string): boolean {
  return /deepseek\.com/i.test(baseURL);
}

/**
 * 总是优先用 @ai-sdk/deepseek 处理 DeepSeek。
 * DeepSeek 的所有端点（包括 /anthropic）本质上都是 OpenAI Chat Completions 兼容的。
 * 只在 base URL 明确非 DeepSeek 且用户选了 Anthropic 格式时，才用 createAnthropic。
 */
function createLanguageModel(config: AgentApiConfig): LanguageModel {
  const modelId = config.model.trim() || 'deepseek-v4-pro';
  const baseURL = config.baseURL.trim();

  // DeepSeek 所有端点走 @ai-sdk/deepseek（内部正确处理 /v1/chat/completions）
  if (isDeepSeekHost(baseURL)) {
    const ds = createDeepSeek({
      apiKey: config.apiKey,
      ...(baseURL ? { baseURL: cleanBaseURL(baseURL) } : {}),
    });
    return ds.chat(modelId);
  }

  // 非 DeepSeek 的 Anthropic 格式
  if (config.format === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
    return anthropic(modelId || 'claude-sonnet-4-6');
  }

  // 非 DeepSeek 的 OpenAI 兼容
  const openai = createOpenAI({
    apiKey: config.apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
  return openai.chat(modelId);
}

function messageContentToText(content: ModelMessage['content']): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return String((part as { text?: string }).text ?? '');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

/** 将 system 角色消息合并为 streamText 的 system 参数，避免 SDK 安全警告 */
function splitSystemMessages(messages: ModelMessage[]): {
  system: string;
  conversation: ModelMessage[];
} {
  const systemParts: string[] = [];
  const conversation: ModelMessage[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      const text = messageContentToText(m.content);
      if (text) systemParts.push(text);
    } else {
      conversation.push(m);
    }
  }

  const baseSystem = getSystemPrompt();
  const system = systemParts.length > 0
    ? `${baseSystem}\n\n${systemParts.join('\n\n')}`
    : baseSystem;

  return { system, conversation };
}

// Layer 2: Step-level message pruning
function compressStepMessages(messages: ModelMessage[]): ModelMessage[] {
  if (messages.length <= STEP_COMPRESS_THRESHOLD) return messages;
  const nonSystem = messages.filter(m => m.role !== 'system');
  let toolCount = 0;
  const changeSummaries = new Set<string>();
  for (const m of nonSystem) {
    if (m.role === 'tool' && Array.isArray(m.content)) {
      toolCount++;
      for (const part of m.content) {
        if (part.type === 'tool-result' && part.output) {
          try {
            const p = typeof part.output === 'string' ? JSON.parse(part.output) : part.output;
            if (p && typeof p === 'object') {
              if (p.added) changeSummaries.add(`+${p.added}`);
              if (p.removed) changeSummaries.add(`-${p.removed}`);
              if (p.message) changeSummaries.add(p.message as string);
            }
          } catch { /* raw */ }
        }
      }
    }
  }
  const compact: ModelMessage[] = [];
  if (toolCount > 3 && changeSummaries.size > 0) {
    compact.push({
      role: 'user',
      content: `[Compressed ${toolCount} tool results. Changes: ${[...changeSummaries].slice(0, 8).join(' | ')}]`,
    });
  }
  const recent = nonSystem.slice(-8);
  return [...compact, ...recent];
}

// Layer 3: Session compaction
function compactSession(messages: ModelMessage[]): ModelMessage[] {
  if (messages.length <= SESSION_COMPACT_THRESHOLD) return messages;
  const nonSystem = messages.filter(m => m.role !== 'system');
  const lastN = nonSystem.slice(-6);
  const ops: string[] = [];
  const userInputs: string[] = [];
  for (const m of nonSystem.slice(0, -6)) {
    if (m.role === 'user' && typeof m.content === 'string') {
      userInputs.push(m.content.slice(0, 100));
    }
    if (m.role === 'tool' && Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === 'tool-result' && part.output) {
          try {
            const p = typeof part.output === 'string' ? JSON.parse(part.output) : part.output;
            if (p && typeof p === 'object') {
              if (p.added) ops.push(`added ${p.added}`);
              if (p.removed) ops.push(`removed ${p.removed}`);
            }
          } catch { /* */ }
        }
      }
    }
  }
  const lines: string[] = [];
  if (ops.length > 0) lines.push(`Operations: ${ops.join('; ')}`);
  if (userInputs.length > 0) lines.push(`Earlier: ${userInputs.slice(-5).join(' | ')}`);
  const summary: ModelMessage = {
    role: 'user',
    content: `[SESSION COMPACTED]\n${lines.join('\n')}`,
  };
  return [summary, ...lastN];
}

function agentStepOptions() {
  return {
    tools: ALL_TOOLS,
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: 4096,
    prepareStep: async ({ messages: stepMsgs }: { messages: ModelMessage[] }) => {
      if (stepMsgs.length > STEP_COMPRESS_THRESHOLD) {
        return { messages: compressStepMessages(stepMsgs) };
      }
      return {};
    },
  };
}

function buildRequestContext(apiConfig: AgentApiConfig, messages: ModelMessage[]) {
  const model = createLanguageModel(apiConfig);
  let history = [...messages];
  if (history.length > SESSION_COMPACT_THRESHOLD) {
    history = compactSession(history);
  }
  const { system, conversation } = splitSystemMessages(history);
  return { model, system, conversation };
}

function buildOpenAITools(): Array<{
  type: 'function';
  function: { name: string; description: string; parameters: unknown };
}> {
  return Object.entries(ALL_TOOLS).map(([name, t]) => ({
    type: 'function' as const,
    function: {
      name,
      description: t.description ?? '',
      parameters: (t as { inputSchema?: unknown }).inputSchema ?? { type: 'object', properties: {} },
    },
  }));
}

function toOpenAIChatMessages(
  system: string,
  conversation: ModelMessage[],
): Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; tool_calls?: unknown }> {
  const out: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string; tool_calls?: unknown }> = [
    { role: 'system', content: system },
  ];
  for (const m of conversation) {
    if (m.role === 'tool' && Array.isArray(m.content)) {
      // Tool result messages
      for (const part of m.content) {
        if (part.type === 'tool-result') {
          const output = typeof part.output === 'string' ? part.output : JSON.stringify(part.output);
          out.push({
            role: 'tool',
            tool_call_id: part.toolCallId,
            content: output,
          });
        }
      }
    } else if (m.role === 'assistant' && Array.isArray(m.content)) {
      // Assistant message may contain text + tool_calls
      const textParts: string[] = [];
      const toolCalls: unknown[] = [];
      for (const part of m.content) {
        if (part.type === 'text' && part.text) {
          textParts.push(part.text);
        } else if (part.type === 'tool-call') {
          toolCalls.push({
            id: part.toolCallId,
            type: 'function',
            function: {
              name: part.toolName,
              arguments: typeof part.input === 'string' ? part.input : JSON.stringify(part.input),
            },
          });
        }
      }
      const msg: { role: 'assistant'; content: string; tool_calls?: unknown } = {
        role: 'assistant',
        content: textParts.join('\n') || '',
      };
      if (toolCalls.length > 0) {
        msg.tool_calls = toolCalls;
      }
      out.push(msg);
    } else if (m.role === 'user') {
      const content = messageContentToText(m.content);
      if (content) out.push({ role: m.role as 'user', content });
    }
  }
  return out;
}

/** 直接调用 DeepSeek OpenAI 兼容接口（stream: false），手动处理 tool call 循环 */
async function runAgentLoopNonStream(input: AgentLoopInput): Promise<AgentLoopOutput> {
  const { apiConfig, messages, signal, onTextDelta, onToolCallStart, onToolCallResult } = input;
  const { system, conversation } = buildRequestContext(apiConfig, messages);

  const modelId = apiConfig.model.trim() || 'deepseek-v4-pro';
  const baseURL = cleanBaseURL(
    apiConfig.baseURL.trim() || 'https://api.deepseek.com',
  );
  const endpoint = `${baseURL}/v1/chat/completions`;

  const apiMessages = toOpenAIChatMessages(system, conversation);
  let fullText = '';
  let stepCount = 0;

  // Agentic loop: call → check for tool_calls → execute → append → repeat
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 4096,
        stream: false,
        messages: apiMessages,
        tools: buildOpenAITools(),
        tool_choice: step === 0 ? 'auto' : 'auto',
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let detail = errText.slice(0, 300);
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        detail = parsed.error?.message ?? detail;
      } catch { /* raw */ }
      throw new Error(detail || `API 请求失败 (${res.status})`);
    }

    const data = await res.json() as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('API 返回为空');

    // Check for tool calls
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      const toolCalls = msg.tool_calls;
      const toolResults: Array<{ role: 'tool'; tool_call_id: string; content: string }> = [];

      // Add assistant message with tool calls
      apiMessages.push({
        role: 'assistant',
        content: msg.content ?? '',
        tool_calls: toolCalls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      });

      for (const tc of toolCalls) {
        stepCount += 1;
        const toolName = tc.function.name;
        let toolInput: unknown;
        try { toolInput = JSON.parse(tc.function.arguments); } catch { toolInput = tc.function.arguments; }

        onToolCallStart?.(tc.id, toolName, toolInput);

        // Execute tool
        const toolFn = ALL_TOOLS[toolName as keyof typeof ALL_TOOLS];
        let result: unknown;
        if (toolFn?.execute) {
          try {
            result = await (toolFn.execute as (input: unknown) => Promise<unknown>)(toolInput);
          } catch (e) {
            result = { error: (e as Error).message };
          }
        } else {
          result = { error: `Unknown tool: ${toolName}` };
        }

        onToolCallResult?.(tc.id, result);
        toolResults.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      apiMessages.push(...toolResults);
      continue; // Loop back for next step
    }

    // No tool calls — this is the final text response
    fullText = (msg.content ?? '').trim();
    if (fullText) {
      onTextDelta?.(fullText);
    }
    break;
  }

  return { text: fullText, steps: stepCount };
}

async function runAgentLoopWithStream(input: AgentLoopInput): Promise<AgentLoopOutput> {
  const { apiConfig, messages, signal, onTextDelta, onToolCallStart, onToolCallResult } = input;
  const { model, system, conversation } = buildRequestContext(apiConfig, messages);

  const result = streamText({
    model,
    system,
    messages: conversation,
    abortSignal: signal,
    ...agentStepOptions(),
  });

  let fullText = '';
  let stepCount = 0;
  for await (const part of result.fullStream) {
    if (part.type === 'error') {
      const errPart = part as { error?: unknown };
      const err = errPart.error;
      throw err instanceof Error ? err : new Error(String(err ?? '模型流式响应出错'));
    }
    if (part.type === 'text-delta') {
      fullText += part.text;
      onTextDelta?.(part.text);
    } else if (part.type === 'tool-call') {
      stepCount += 1;
      onToolCallStart?.(part.toolCallId, part.toolName, part.input);
    } else if (part.type === 'tool-result') {
      onToolCallResult?.(part.toolCallId, (part as { output?: unknown }).output);
    }
  }

  const finalText = await result.text;
  if (!fullText && finalText) {
    fullText = finalText;
    onTextDelta?.(finalText);
  }

  return { text: fullText, steps: stepCount };
}

export async function runAgentLoopStream(input: AgentLoopInput): Promise<AgentLoopOutput> {
  if (AGENT_USE_STREAMING) {
    return runAgentLoopWithStream(input);
  }
  return runAgentLoopNonStream(input);
}
