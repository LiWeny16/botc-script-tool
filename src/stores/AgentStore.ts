import { makeAutoObservable, runInAction, observable } from 'mobx';
import type { ModelMessage } from 'ai';
import {
  getActiveApiConfig, saveActiveApiConfig, saveSelectedProvider, getSelectedProvider,
  migrateLegacyConfig, type AgentApiConfig,
} from '../utils/agentApiConfig';
import { runAgentLoopStream } from '../utils/agentLoop';
import { alertError, alertWarning } from '../utils/alert';
import { translations, type TranslationKey } from '../utils/i18n';
import { configStore } from './ConfigStore';

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
  isError?: boolean;
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
  selectedProvider: string;

  private abortController: AbortController | null = null;

  constructor() {
    migrateLegacyConfig();
    this.selectedProvider = getSelectedProvider();
    this.apiConfig = getActiveApiConfig();
    makeAutoObservable(this);
    this.loadHistory();
  }

  get isConfigured() {
    return !!this.apiConfig.apiKey.trim();
  }

  setProvider(providerId: string) {
    this.selectedProvider = providerId;
    saveSelectedProvider(providerId);
    this.apiConfig = getActiveApiConfig();
  }

  refreshApiConfig() {
    this.apiConfig = getActiveApiConfig();
  }

  clearError() {
    this.error = null;
  }

  private t(key: TranslationKey): string {
    return translations[configStore.language]?.[key] ?? translations.en[key] ?? key;
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
        // Only include text content when rebuilding history for the next API call.
        // Tool call/result pairs are not sent back — they're internal implementation
        // details that cause schema validation errors when reconstructed from history.
        // The assistant's text response is sufficient to maintain conversation context.
        if (msg.content) {
          modelMessages.push({ role: 'assistant', content: msg.content });
        }
      }
    }
    return modelMessages;
  }

  setDialogOpen(open: boolean) { this.dialogOpen = open; }
  toggleDialog() { this.dialogOpen = !this.dialogOpen; }

  updateApiConfig(config: Partial<AgentApiConfig>) {
    this.apiConfig = { ...this.apiConfig, ...config };
    saveActiveApiConfig(config);
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
          last.content = this.t('agent.stoppedHint');
          last.isError = true;
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
      const hint = this.t('agent.apiKeyRequiredHint');
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
      const storedTemp = parseFloat(localStorage.getItem('botc-agent-temperature') || '0.7');
      const storedMax = parseInt(localStorage.getItem('botc-agent-max-tokens') || '4096', 10);
      const result = await runAgentLoopStream({
        apiConfig: this.apiConfig,
        messages: this.lastMessages,
        signal,
        temperature: isNaN(storedTemp) ? 0.7 : storedTemp,
        maxTokens: isNaN(storedMax) ? 4096 : storedMax,
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
          const emptyHint = this.t('agent.errorEmptyResponse');
          streamingMsg.content = emptyHint;
          streamingMsg.isError = true;
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
          : `${this.t('agent.errorRequestFailed')}${msg}`;
        streamingMsg.isError = true;
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
            streamingMsg.content = this.t('agent.errorRequestIncomplete');
            streamingMsg.isError = true;
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
