import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from '@google/generative-ai';
import { configManager } from '../config/ConfigManager';
import {
  getProviderDef,
  type LlmProviderId,
} from '../config/llm-providers';

export type ContentType = 'poster' | 'video' | 'slide';

export interface VideoScene {
  sceneId: number;
  visualText: string;
  voiceoverText: string;
  motionType: string;
  duration: number;
}

export interface VideoScript {
  scenes: VideoScene[];
  title?: string;
  language?: string;
}

const SCENE_SCHEMA_DESCRIPTION = `{
  "title": string,
  "language": "vi",
  "scenes": [
    {
      "sceneId": number,
      "visualText": string,
      "voiceoverText": string,
      "motionType": string,
      "duration": number
    }
  ]
}`;

function getLlmConfig() {
  return configManager.getConfig().llm;
}

function getApiKey(optional = false): string {
  const key = getLlmConfig().apiKey?.trim();
  if (!key) {
    if (optional) return '';
    throw new Error(
      'Vui lòng cấu hình API Key trong mục Cài đặt → AI Provider.'
    );
  }
  return key;
}

function getModelName(): string {
  return getLlmConfig().model?.trim() || 'gemini-1.5-pro';
}

function getProvider(): LlmProviderId {
  const id = getLlmConfig().provider || 'gemini';
  return getProviderDef(id).id;
}

function resolveBaseUrl(providerId: LlmProviderId, override?: string): string {
  const fromConfig = (override ?? getLlmConfig().baseUrl ?? '').trim();
  if (fromConfig) return fromConfig.replace(/\/$/, '');
  return getProviderDef(providerId).defaultBaseUrl.replace(/\/$/, '');
}

function buildSystemPrompt(contentType: ContentType): string {
  return [
    'You are the OmniStudio OS AI Brain — a senior Vietnamese content director.',
    `Content type: ${contentType}.`,
    'Produce a production-ready storyboard for local HTML → motion → video tooling.',
    '',
    'STRICT OUTPUT RULES:',
    '1. Respond with ONLY valid JSON. No markdown, no code fences, no commentary.',
    '2. The JSON MUST match this schema exactly:',
    SCENE_SCHEMA_DESCRIPTION,
    '3. language must be "vi" (Vietnamese).',
    '4. visualText: short on-screen copy (Vietnamese), suitable for a single frame.',
    '5. voiceoverText: natural spoken Vietnamese for TTS. For poster/slide, you may use "".',
    '6. motionType: one of typewriter | fade-in | glitch | slide-up | zoom-in | ken-burns.',
    '7. duration: seconds (number > 0) for that scene. Sum of durations should match the requested total length when provided.',
    '8. scenes: follow the requested scene/block count from the user brief when provided (allow 3–60). sceneId starts at 1.',
    '9. For long videos (>10 minutes): group as chapters/blocks; keep visualText short; voiceoverText can be longer.',
    '10. Prefer clear Vietnamese diacritics; avoid broken encoding.',
  ].join('\n');
}

/**
 * Aggressively strip markdown fences / prose and extract a JSON object.
 */
export function extractJsonPayload(raw: string): string {
  let text = String(raw ?? '').trim();

  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const fenceMatch = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    text = fenceMatch[1].trim();
  } else {
    text = text.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/i, '');
  }

  text = text.replace(/^json\s+/i, '').trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM response did not contain a JSON object.');
  }

  let candidate = text.slice(start, end + 1);
  candidate = candidate.replace(/,\s*([}\]])/g, '$1');
  return candidate;
}

function assertVideoScript(data: unknown): VideoScript {
  if (!data || typeof data !== 'object') {
    throw new Error('Parsed script is not an object.');
  }

  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.scenes) || record.scenes.length === 0) {
    throw new Error('Script JSON must include a non-empty "scenes" array.');
  }

  const scenes: VideoScene[] = record.scenes.map((scene, index) => {
    if (!scene || typeof scene !== 'object') {
      throw new Error(`Scene at index ${index} is not an object.`);
    }
    const s = scene as Record<string, unknown>;

    const sceneId = Number(s.sceneId ?? index + 1);
    const visualText = String(s.visualText ?? '').trim();
    const voiceoverText = String(s.voiceoverText ?? '').trim();
    const motionType = String(s.motionType ?? 'fade-in').trim() || 'fade-in';
    const duration = Number(s.duration);

    if (!visualText) {
      throw new Error(`Scene ${sceneId}: visualText is required.`);
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(`Scene ${sceneId}: duration must be a positive number.`);
    }

    return {
      sceneId: Number.isFinite(sceneId) ? sceneId : index + 1,
      visualText,
      voiceoverText,
      motionType,
      duration,
    };
  });

  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    language: typeof record.language === 'string' ? record.language : 'vi',
    scenes,
  };
}

let cachedGemini: GenerativeModel | null = null;
let cachedKey: string | null = null;
let cachedModelName: string | null = null;

configManager.onChange(() => {
  cachedGemini = null;
  cachedKey = null;
  cachedModelName = null;
});

function getGeminiModel(apiKey: string, modelName: string): GenerativeModel {
  if (
    cachedGemini &&
    cachedKey === apiKey &&
    cachedModelName === modelName
  ) {
    return cachedGemini;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedGemini = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });
  cachedKey = apiKey;
  cachedModelName = modelName;
  return cachedGemini;
}

async function chatOpenAICompatible(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  jsonMode?: boolean;
}): Promise<string> {
  const url = `${opts.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opts.apiKey) {
    headers.Authorization = `Bearer ${opts.apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: opts.model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  };
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `OpenAI-compatible API HTTP ${res.status}: ${text.slice(0, 300)}`
    );
  }

  if (!res.ok) {
    const errObj = parsed as {
      error?: { message?: string };
      message?: string;
    };
    const msg =
      errObj.error?.message ||
      errObj.message ||
      text.slice(0, 300);
    throw new Error(`OpenAI-compatible API HTTP ${res.status}: ${msg}`);
  }

  const data = parsed as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) {
    throw new Error('OpenAI-compatible API returned empty content.');
  }
  return content;
}

async function chatAnthropic(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const root = opts.baseUrl.replace(/\/$/, '') || 'https://api.anthropic.com';
  const url = `${root}/v1/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 4096,
      temperature: 0.7,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    }),
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Anthropic API HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const errObj = parsed as {
      error?: { message?: string };
      message?: string;
    };
    const msg =
      errObj.error?.message || errObj.message || text.slice(0, 300);
    throw new Error(`Anthropic API HTTP ${res.status}: ${msg}`);
  }

  const data = parsed as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const blocks = data.content ?? [];
  const joined = blocks
    .filter((b) => b.type === 'text' && b.text)
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!joined) {
    throw new Error('Anthropic API returned empty content.');
  }
  return joined;
}

async function completeChat(opts: {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  system: string;
  user: string;
  preferJson?: boolean;
}): Promise<{ text: string; providerLabel: string }> {
  const providerId = getProviderDef(opts.provider || getProvider()).id;
  const def = getProviderDef(providerId);
  const model =
    (opts.model || '').trim() || getModelName() || def.models[0];
  const keyOptional = Boolean(def.keyOptional);
  const apiKey =
    (opts.apiKey || '').trim() || getApiKey(keyOptional);
  const baseUrl = resolveBaseUrl(providerId, opts.baseUrl);

  if (!keyOptional && (!apiKey || apiKey.includes('•') || apiKey.includes('...'))) {
    throw new Error('Vui lòng nhập API Key hợp lệ.');
  }

  if (def.apiStyle === 'gemini') {
    const gemini = getGeminiModel(apiKey, model);
    const result = await gemini.generateContent([
      { text: opts.system },
      { text: opts.user },
    ]);
    return {
      text: result.response.text() || '',
      providerLabel: def.label,
    };
  }

  if (def.apiStyle === 'anthropic') {
    const text = await chatAnthropic({
      baseUrl: baseUrl || def.defaultBaseUrl,
      apiKey,
      model,
      system: opts.system,
      user: opts.user,
    });
    return { text, providerLabel: def.label };
  }

  // openai-compatible (incl. google-antigravity, deepseek, custom, ollama…)
  if (!baseUrl) {
    throw new Error(
      `Provider "${def.label}" cần Base URL. Vui lòng điền trong Cài đặt.`
    );
  }

  try {
    const text = await chatOpenAICompatible({
      baseUrl,
      apiKey: apiKey || 'ollama',
      model,
      system: opts.system,
      user: opts.user,
      jsonMode: opts.preferJson,
    });
    return { text, providerLabel: def.label };
  } catch (err) {
    // Some providers reject response_format — retry without it
    if (opts.preferJson) {
      const text = await chatOpenAICompatible({
        baseUrl,
        apiKey: apiKey || 'ollama',
        model,
        system: opts.system,
        user: opts.user,
        jsonMode: false,
      });
      return { text, providerLabel: def.label };
    }
    throw err;
  }
}

/** Lightweight connectivity probe used by Settings → Test Connection. */
export async function testLlmConnection(overrides?: {
  apiKey?: string;
  model?: string;
  provider?: string;
  baseUrl?: string;
}): Promise<{ ok: boolean; message: string }> {
  const providerId = getProviderDef(
    overrides?.provider || getProvider()
  ).id;
  const def = getProviderDef(providerId);
  const model =
    (overrides?.model || '').trim() ||
    getLlmConfig().model ||
    def.models[0];
  const key =
    (overrides?.apiKey || '').trim() ||
    (def.keyOptional ? getApiKeySafe() : getApiKeySafe());

  if (
    !def.keyOptional &&
    (!key || key.includes('•') || key.includes('...'))
  ) {
    return {
      ok: false,
      message: 'Vui lòng nhập API Key hợp lệ để kiểm tra kết nối.',
    };
  }

  try {
    const { text, providerLabel } = await completeChat({
      provider: providerId,
      apiKey: key,
      model,
      baseUrl: overrides?.baseUrl,
      system: 'You are a connection test helper.',
      user: 'Reply with the single word: pong',
      preferJson: false,
    });
    return {
      ok: true,
      message: `Kết nối ${providerLabel} thành công (${model}). Phản hồi: ${text.slice(0, 80) || '(trống)'}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Không kết nối được ${def.label}: ${message}`,
    };
  }
}

function getApiKeySafe(): string {
  try {
    return getApiKey(true);
  } catch {
    return '';
  }
}

/**
 * Ask the configured LLM for a strict JSON storyboard (scenes[]).
 */
export async function generateVideoScript(
  userPrompt: string,
  contentType: ContentType
): Promise<VideoScript> {
  if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    throw new Error(
      'generateVideoScript: userPrompt must be a non-empty string.'
    );
  }

  const allowed: ContentType[] = ['poster', 'video', 'slide'];
  if (!allowed.includes(contentType)) {
    throw new Error(
      `generateVideoScript: contentType must be one of ${allowed.join(', ')}.`
    );
  }

  const system = buildSystemPrompt(contentType);
  const user = [
    `User brief:\n${userPrompt.trim()}`,
    '',
    'Return ONLY the JSON object now.',
  ].join('\n');

  let rawText = '';
  let providerLabel = 'LLM';
  try {
    const result = await completeChat({
      system,
      user,
      preferJson: true,
    });
    rawText = result.text;
    providerLabel = result.providerLabel;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${providerLabel} API request failed: ${message}`);
  }

  if (!rawText?.trim()) {
    throw new Error(`${providerLabel} returned an empty response.`);
  }

  try {
    const jsonText = extractJsonPayload(rawText);
    const parsed: unknown = JSON.parse(jsonText);
    return assertVideoScript(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        `Failed to parse ${providerLabel} JSON storyboard.`,
        message,
        `Raw (truncated): ${rawText.slice(0, 500)}`,
      ].join('\n')
    );
  }
}

export const llmService = {
  generateVideoScript,
  extractJsonPayload,
  testLlmConnection,
};

export default llmService;
