import { supabase } from '../lib/supabase';

export interface AgentApiConfig {
  format: 'openai' | 'anthropic';
  apiKey: string;
  baseURL: string;
  model: string;
}

// ── Provider Presets ──

export interface ProviderPreset {
  id: string;
  name: string;
  icon: string;
  format: AgentApiConfig['format'];
  baseURL: string;
  models: string[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '/imgs/icons/brands/deepseek-color.svg',
    format: 'openai',
    baseURL: 'https://api.deepseek.com',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '/imgs/icons/brands/chatgpt-color.svg',
    format: 'openai',
    baseURL: 'https://api.openai.com/v1',
    models: ['gpt-5.5', 'gpt-5.5-pro', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'o4-mini', 'o3'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '/imgs/icons/brands/anthropic-color.svg',
    format: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    models: ['claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  },
];

// ── Per-Provider Storage ──

const PROVIDER_KEY_PREFIX = 'botc-agent-provider-';

export interface ProviderConfig {
  apiKey: string;
  model: string;
  baseURL: string;
  format: AgentApiConfig['format'];
}

function providerDefaults(id: string): ProviderConfig {
  const preset = PROVIDER_PRESETS.find(p => p.id === id);
  return {
    apiKey: '',
    model: preset?.models[0] ?? '',
    baseURL: preset?.baseURL ?? '',
    format: preset?.format ?? 'openai',
  };
}

export function getProviderConfig(providerId: string): ProviderConfig {
  try {
    const raw = localStorage.getItem(PROVIDER_KEY_PREFIX + providerId);
    if (raw) return { ...providerDefaults(providerId), ...JSON.parse(raw) };
  } catch { /* */ }
  return providerDefaults(providerId);
}

export function saveProviderConfig(providerId: string, config: Partial<ProviderConfig>): void {
  const current = getProviderConfig(providerId);
  const merged = { ...current, ...config };
  try { localStorage.setItem(PROVIDER_KEY_PREFIX + providerId, JSON.stringify(merged)); } catch { /* */ }
}

// ── Selected Provider ──

const SELECTED_PROVIDER_KEY = 'botc-agent-selected-provider';

export function getSelectedProvider(): string {
  return localStorage.getItem(SELECTED_PROVIDER_KEY) || 'deepseek';
}

export function saveSelectedProvider(providerId: string): void {
  try { localStorage.setItem(SELECTED_PROVIDER_KEY, providerId); } catch { /* */ }
}

// ── Active Config (combines provider + selection) ──

export function getActiveApiConfig(): AgentApiConfig {
  const providerId = getSelectedProvider();
  const pc = getProviderConfig(providerId);
  return {
    format: pc.format,
    apiKey: pc.apiKey,
    baseURL: pc.baseURL,
    model: pc.model,
  };
}

export function saveActiveApiConfig(config: Partial<AgentApiConfig>): void {
  const providerId = getSelectedProvider();
  saveProviderConfig(providerId, config);
}

// ── Legacy Compat: load old single-key config into DeepSeek provider ──

const LEGACY_KEY = 'botc-agent-api-config';

export function migrateLegacyConfig(): void {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw) as AgentApiConfig;
    // Only migrate if the current provider has no key set
    const current = getProviderConfig('deepseek');
    if (!current.apiKey && legacy.apiKey) {
      saveProviderConfig('deepseek', {
        apiKey: legacy.apiKey,
        model: legacy.model || 'deepseek-v4-pro',
        baseURL: legacy.baseURL || 'https://api.deepseek.com',
        format: legacy.format || 'openai',
      });
    }
    // Don't delete legacy key — keep as backup
  } catch { /* */ }
}

// ── Cloud Sync ──

export async function saveApiConfigToCloud(config: AgentApiConfig): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('user_api_keys')
    .upsert({
      user_id: user.id,
      provider_format: config.format,
      base_url: config.baseURL || null,
      api_key_encrypted: config.apiKey,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  return !error;
}

export async function loadApiConfigFromCloud(): Promise<Partial<AgentApiConfig> | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('provider_format, base_url, api_key_encrypted')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    format: (data.provider_format as AgentApiConfig['format']) || 'openai',
    apiKey: data.api_key_encrypted || '',
    baseURL: data.base_url || '',
  };
}
