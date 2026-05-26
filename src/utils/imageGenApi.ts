export const MODELS = {
  SEEDREAM_5_0: 'doubao-seedream-5-0-260128',
  SEEDREAM_4_5: 'doubao-seedream-4-5-251128',
  SEEDREAM_4_0: 'doubao-seedream-4-0-250828',
} as const;

export const MODEL_LABELS: Record<string, string> = {
  [MODELS.SEEDREAM_5_0]: 'Seedream 5.0 Lite',
  [MODELS.SEEDREAM_4_5]: 'Seedream 4.5',
  [MODELS.SEEDREAM_4_0]: 'Seedream 4.0',
};

export const MODEL_SIZES: Record<string, string[]> = {
  [MODELS.SEEDREAM_5_0]: ['2K', '3K', '4K'],
  [MODELS.SEEDREAM_4_5]: ['2K', '4K'],
  [MODELS.SEEDREAM_4_0]: ['1K', '2K', '4K'],
};

export type GenerationMode = 'text-to-image' | 'image-to-image' | 'multi-image-fusion' | 'group-generation';

export interface ImageGenParams {
  model: string;
  prompt: string;
  image?: string | string[];
  size: string;
  sequential_image_generation?: 'auto' | 'disabled';
  sequential_image_generation_options?: { max_images: number };
  output_format?: 'png' | 'jpeg';
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
}

export interface ImageGenResponse {
  data: Array<{ url?: string; b64_json?: string; size?: string }>;
}

export async function generateImage(
  apiKey: string,
  params: ImageGenParams,
  signal?: AbortSignal,
  proxyBaseUrl?: string,
): Promise<ImageGenResponse> {
  const baseUrl = proxyBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3';
  const response = await fetch(
    `${baseUrl}/images/generations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(params),
      signal,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

const TEAM_COLOR_LABELS: Record<string, string> = {
  townsfolk: 'deep blue',
  outsider: 'bright blue',
  minion: 'crimson red',
  demon: 'dark blood red',
  traveler: 'rich purple',
  fabled: 'golden yellow',
  loric: 'emerald green',
};

const STYLE_PROMPT = [
  'Flat vector illustration style',
  'Bold graphic design with strong silhouettes',
  'Distressed vintage grainy texture, screen-printed appearance',
  'White or cream outlines defining shapes',
  'Solid white background',
  'Iconic symbolic representation, not realistic portrait',
  'Square format, centered composition',
  'Clean, bold, easily recognizable at small sizes',
  'Sticker-like appearance with subtle edge texture',
].join('. ');

export function buildPrompt(
  userPrompt: string,
  teamColor?: string,
): string {
  const color = teamColor ? TEAM_COLOR_LABELS[teamColor] : 'monochromatic';
  return `${userPrompt}. ${STYLE_PROMPT}. Use ${color ?? 'monochromatic'} color scheme.`;
}

export async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
