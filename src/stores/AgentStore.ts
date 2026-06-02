import { makeAutoObservable, runInAction, observable } from 'mobx';
import type { ModelMessage } from 'ai';
import { getAgentApiConfig, saveAgentApiConfig, type AgentApiConfig } from '../utils/agentApiConfig';
import { runAgentLoopStream } from '../utils/agentLoop';
import { alertError, alertWarning } from '../utils/alert';

export interface AgentToolCall {
  toolCallId: string;
  toolName: string;
  toolInput: unknown;
  toolResult: unknown;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: AgentToolCall[];
  streaming?: boolean;
  timestamp: number;
}

export type AgentStatus = 'idle' | 'thinking' | 'error';

const HISTORY_KEY = 'botc-agent-history';
const MAX_HISTORY = 50;

let msgSeq = 0;
function nextMsgId() { return `msg_${Date.now()}_${++msgSeq}`; }

class AgentStore {
  messages: AgentMessage[] = [];
  status: AgentStatus = 'idle';
  error: string | null = null;
  dialogOpen = false;
  apiConfig: AgentApiConfig;

  private abortController: AbortController | null = null;

  constructor() {
    this.apiConfig = getAgentApiConfig();
    makeAutoObservable(this);
    this.loadHistory();
  }

  get isConfigured() {
    return !!this.apiConfig.apiKey.trim();
  }

  clearError() {
    this.error = null;
  }

  /** Build ModelMessage[] for the LLM from display messages */
  get lastMessages(): ModelMessage[] {
    const modelMessages: ModelMessage[] = [];
    for (const msg of this.messages) {
      // Skip streaming messages — they're incomplete
      if (msg.streaming) continue;
      if (msg.role === 'user') {
        modelMessages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        // Assistant message content (no tool results — those were sent in previous loop steps)
        const parts: Array<Record<string, unknown>> = [];
        // Always include a text part — SDK requires at least one content part
        parts.push({ type: 'text', text: msg.content || '' });
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            parts.push({
              type: 'tool-call',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.toolInput,
            });
          }
        }
        modelMessages.push({
          role: 'assistant',
          content: parts as never,
        });
        // Add separate tool result messages for each completed tool call
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            // Skip tool calls without results (shouldn't happen for completed messages)
            if (tc.toolResult === null || tc.toolResult === undefined) continue;
            modelMessages.push({
              role: 'tool' as const,
              content: [{
                type: 'tool-result',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                output: tc.toolResult, // raw object — SDK handles serialization
              }],
            } as ModelMessage);
          }
        }
      }
    }
    return modelMessages;
  }

  setDialogOpen(open: boolean) { this.dialogOpen = open; }
  toggleDialog() { this.dialogOpen = !this.dialogOpen; }

  updateApiConfig(config: Partial<AgentApiConfig>) {
    this.apiConfig = { ...this.apiConfig, ...config };
    saveAgentApiConfig(this.apiConfig);
  }

  addMessage(msg: Omit<AgentMessage, 'id' | 'timestamp'>) {
    const fullMsg: AgentMessage = observable({ ...msg, id: nextMsgId(), timestamp: Date.now() });
    this.messages.push(fullMsg);
    if (this.messages.length > MAX_HISTORY) {
      this.messages = this.messages.slice(-MAX_HISTORY);
    }
    this.persistHistory();
    return fullMsg;
  }

  /** Update the last message in-place (used for streaming) */
  private updateLastMessage(updates: Partial<AgentMessage>) {
    if (this.messages.length === 0) return;
    const last = this.messages[this.messages.length - 1];
    Object.assign(last, updates);
  }

  clearHistory() {
    this.messages = [];
    this.status = 'idle';
    this.error = null;
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
  }

  cancelGeneration() {
    this.abortController?.abort();
    runInAction(() => {
      const last = this.messages[this.messages.length - 1];
      if (last?.streaming) {
        last.streaming = false;
        if (!last.content && !last.toolCalls?.length) {
          last.content = '（已停止生成）';
        }
      }
      this.status = 'idle';
      this.persistHistory();
    });
  }

  async sendMessage(text: string): Promise<boolean> {
    const trimmed = text.trim();
    if (!trimmed) return false;

    if (!this.apiConfig.apiKey.trim()) {
      const hint = '请先在右上角齿轮中填写 API Key，并点击「保存本地」。';
      runInAction(() => { this.error = hint; });
      alertWarning(hint, 3500);
      return false;
    }

    this.addMessage({ role: 'user', content: trimmed });

    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Create placeholder streaming message
    const streamingMsg = this.addMessage({ role: 'assistant', content: '', streaming: true });

    runInAction(() => {
      this.status = 'thinking';
      this.error = null;
    });

    try {
      const result = await runAgentLoopStream({
        apiConfig: this.apiConfig,
        messages: this.lastMessages,
        signal,
        onTextDelta: (delta: string) => {
          if (signal.aborted) return;
          runInAction(() => {
            streamingMsg.content += delta;
          });
        },
        onToolCallStart: (toolCallId: string, toolName: string, input: unknown) => {
          if (signal.aborted) return;
          runInAction(() => {
            if (!streamingMsg.toolCalls) streamingMsg.toolCalls = [];
            streamingMsg.toolCalls.push({
              toolCallId,
              toolName,
              toolInput: input,
              toolResult: null,
            });
          });
        },
        onToolCallResult: (toolCallId: string, result: unknown) => {
          if (signal.aborted) return;
          runInAction(() => {
            const tc = streamingMsg.toolCalls?.find(t => t.toolCallId === toolCallId);
            if (tc) tc.toolResult = result;
          });
        },
      });

      if (signal.aborted) return false;

      runInAction(() => {
        streamingMsg.streaming = false;
        if (
          !streamingMsg.content.trim()
          && (!streamingMsg.toolCalls || streamingMsg.toolCalls.length === 0)
        ) {
          const emptyHint = '模型未返回内容，请检查 API Key、Base URL 与模型是否可用。';
          streamingMsg.content = emptyHint;
          this.error = emptyHint;
          this.status = 'error';
          alertWarning(emptyHint, 4000);
        } else {
          this.status = 'idle';
          this.error = null;
        }
        this.persistHistory();
      });
      return true;
    } catch (e: unknown) {
      if (signal.aborted) return false;
      const msg = e instanceof Error ? e.message : String(e);
      runInAction(() => {
        streamingMsg.streaming = false;
        streamingMsg.content = streamingMsg.content.trim()
          ? streamingMsg.content
          : `请求失败：${msg}`;
        this.error = msg;
        this.status = 'error';
        this.persistHistory();
      });
      alertError(msg, 4500);
      return false;
    } finally {
      runInAction(() => {
        if (streamingMsg.streaming) {
          streamingMsg.streaming = false;
          if (!streamingMsg.content.trim() && (!streamingMsg.toolCalls?.length)) {
            streamingMsg.content = '请求未完成，请重试或检查网络与 API 配置。';
            this.status = 'error';
          } else if (this.status === 'thinking') {
            this.status = 'idle';
          }
          this.persistHistory();
        }
      });
    }
  }

  private persistHistory() {
    try {
      const slim = this.messages
        .filter(m => !m.streaming)
        .slice(-MAX_HISTORY)
        .map(m => ({
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
          timestamp: m.timestamp,
        }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(slim));
    } catch { /* quota */ }
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        this.messages = arr.map((m: Record<string, unknown>) => observable({
          id: nextMsgId(),
          role: m.role as AgentMessage['role'],
          content: m.content as string,
          toolCalls: m.toolCalls as AgentToolCall[] | undefined,
          streaming: false,
          timestamp: m.timestamp as number,
        }));
      }
    } catch { /* ignore */ }
  }
}

export const agentStore = new AgentStore();
