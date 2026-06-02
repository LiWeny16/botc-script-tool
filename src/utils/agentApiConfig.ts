import { supabase } from '../lib/supabase';

export interface AgentApiConfig {
  format: 'openai' | 'anthropic';
  apiKey: string;
  baseURL: string;
  /** OpenAI 兼容接口的模型 ID，如 deepseek-v4-pro、deepseek-chat */
  model: string;
}

const STORAGE_KEY = 'botc-agent-api-config';

const DEFAULTS: AgentApiConfig = {
  format: 'openai',
  apiKey: '',
  baseURL: '',
  model: 'deepseek-v4-pro',
};

export function getAgentApiConfig(): AgentApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveAgentApiConfig(config: AgentApiConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}

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
