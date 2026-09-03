import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from '@google/generative-ai';
import { configManager } from '../config/ConfigManager';
import {
  getProviderDef,
  type LlmProviderId,
} from '../config/llm-providers';
import { KINETIC_MOTIONS, toScreenCopy } from './kineticCopy';
import {
  assertNormalizedForm,
  type ScriptPart,
  type StudioTemplateType,
} from './scriptForm';

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
  const typeLabel =
    contentType === 'video'
      ? 'video'
      : contentType === 'poster'
        ? 'poster'
        : 'slide thuyết trình';
  return [
    'Bạn là biên tập nội dung LYON Studio — chỉ viết tiếng Việt có dấu.',
    `Loại sản phẩm: ${typeLabel}.`,
    'Tạo bảng cảnh sẵn sàng dựng HTML / chuyển động / video trên máy này.',
    '',
    'QUY TẮC BẮT BUỘC:',
    '1. Chỉ trả về JSON hợp lệ. Không markdown, không giải thích, không tiếng Anh, không tiếng Trung.',
    '2. JSON đúng schema:',
    SCENE_SCHEMA_DESCRIPTION,
    '3. language phải là "vi".',
    '4. visualText: chữ hiện trên màn hình — tiếng Việt ngắn, một khung hình.',
    '5. voiceoverText: lời đọc tiếng Việt tự nhiên. Poster/slide có thể để "".',
    '6. motionType: một trong typewriter | fade-in | glitch | slide-up | zoom-in | ken-burns.',
    '7. duration: số giây > 0. Tổng thời lượng các cảnh khớp brief nếu có.',
    '8. scenes: theo số cảnh/block người dùng yêu cầu (3–60). sceneId bắt đầu từ 1.',
    '9. Video dài (>10 phút): chia chương/block; visualText ngắn; voiceoverText được dài hơn.',
    '10. Luôn dùng tiếng Việt có dấu; không để tofu / mất dấu.',
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
    const voiceoverText = String(s.voiceoverText ?? '').trim();
    const visualText = toScreenCopy(
      String(s.visualText ?? '').trim() || voiceoverText,
      typeof record.title === 'string' ? record.title : `Cảnh ${sceneId}`
    );
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

/**
 * Try primary provider; if it throws, automatically retry with the configured
 * fallback provider (if any). This enables e.g. Ollama → OpenAI graceful degradation.
 */
async function completeChatWithFallback(opts: {
  system: string;
  user: string;
  preferJson?: boolean;
}): Promise<{ text: string; providerLabel: string }> {
  try {
    return await completeChat(opts);
  } catch (primaryErr) {
    const cfg = getLlmConfig();
    const fallbackProvider = cfg.fallbackProvider?.trim();
    if (!fallbackProvider) throw primaryErr;

    const fallbackDef = getProviderDef(fallbackProvider);
    const fallbackKey = cfg.fallbackApiKey?.trim() || '';
    const keyOptional = Boolean(fallbackDef.keyOptional);
    if (!keyOptional && !fallbackKey) throw primaryErr;

    console.warn(
      `[LLMService] Primary provider failed — falling back to ${fallbackDef.label}. Error: ${
        primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
      }`
    );

    return await completeChat({
      ...opts,
      provider: fallbackProvider,
      apiKey: fallbackKey,
      model: cfg.fallbackModel?.trim() || fallbackDef.models[0],
      baseUrl: cfg.fallbackBaseUrl?.trim() || fallbackDef.defaultBaseUrl,
    });
  }
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

function stripHtmlish(text: string): string {
  return String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return '';
}

function extractUserStory(prompt: string): { title: string; body: string } {
  const text = stripHtmlish(prompt);
  const title = firstMatch(text, [
    /(?:Tiêu đề(?:\s+(?:video|bài thuyết trình|poster|tài liệu|bản tin|brochure|quiz))?|Headline|Caption chính|Chủ đề|Tên sự kiện|Tên phiếu)\s*:\s*(.+)/i,
  ]).slice(0, 120);

  const sectionBody = firstMatch(text, [
    /=== BẢN NHÁP HIỆN CÓ[^\n]*===\s*([\s\S]*?)(?=\n=== |\s*$)/,
    /Nội dung soạn thảo:\s*([\s\S]*?)(?=\n=== |\s*$)/,
    /=== BRIEF SÁNG TẠO[^\n]*===\s*([\s\S]*?)(?=\n=== |\s*$)/,
    /=== CẤU TRÚC[^\n]*===\s*([\s\S]*?)(?=\n=== |\s*$)/,
  ]);

  const fieldBits = [
    firstMatch(text, [/Ý chính[^:]*:\s*([\s\S]*?)(?=\n[A-ZÀ-Ỵa-zà-ỹ].+:|\n=== |\s*$)/]),
    firstMatch(text, [/(?:Hook|Câu mở đầu)[^:]*:\s*(.+)/i]),
    firstMatch(text, [/(?:Dàn ý cảnh|Outline)[^:]*:\s*([\s\S]*?)(?=\n[A-ZÀ-Ỵa-zà-ỹ].+:|\n=== |\s*$)/]),
  ].filter(Boolean);

  let body = sectionBody || fieldBits.join('\n\n').trim();
  if (!body) {
    body = text
      .replace(/=== NHIỆM VỤ ===[\s\S]*?(?=\n=== |$)/g, '')
      .replace(/=== THƯƠNG HIỆU ===[\s\S]*?(?=\n=== |$)/g, '')
      .replace(/=== OUTPUT ===[\s\S]*$/g, '')
      .replace(/=== ĐẦU RA ===[\s\S]*$/g, '')
      .replace(/^Constraints:[\s\S]*$/gm, '')
      .trim();
  }
  body = body.replace(/\n(?:Ràng buộc|Constraints)\s*:[\s\S]*$/i, '').trim();

  if (!body) body = text;
  return { title: title || body.split('\n').find((l) => l.trim())?.slice(0, 80) || 'LYON Studio', body };
}

function splitStoryChunks(body: string): string[] {
  const cleaned = body
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^===/.test(t)) return false;
      if (
        /^(Loại nội dung|Template ID|Brand |Constraints|Ràng buộc|Mã mẫu|Mã thương hiệu|Ưu tiên hiệu ứng|Tỷ lệ|Độ phân giải|Nhịp|Hình thức âm thanh|Thời lượng|Số cảnh)\b/i.test(
          t
        )
      ) {
        return false;
      }
      if (/^[•\-]\s*(Mã |Ưu tiên|Giữ giọng|Toàn bộ chữ)/i.test(t)) {
        return false;
      }
      return true;
    })
    .join('\n')
    .trim();

  const byMarker = cleaned
    .split(/(?:^|\n)\s*(?:cảnh|scene|slide|chương)(?:\s*\d+|\s+cuối)?\s*[:.\-–)]*\s*/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (byMarker.length >= 2) return byMarker;

  const byNumber = cleaned
    .split(/(?:^|\n)\s*\d+[\.)]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (byNumber.length >= 2) return byNumber;

  const byPara = cleaned
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (byPara.length >= 2) return byPara;

  const byLine = cleaned
    .split('\n')
    .map((part) => part.replace(/^[-•*]\s+/, '').trim())
    .filter((part) => part.length > 0);
  if (byLine.length >= 2 && byLine.length <= 24) return byLine;

  return cleaned ? [cleaned] : [];
}

/**
 * Storyboard từ kịch bản người dùng — không gọi LLM.
 */
export function buildLocalVideoScript(
  userPrompt: string,
  contentType: ContentType
): VideoScript {
  const { title, body } = extractUserStory(userPrompt);
  const chunks = splitStoryChunks(body);
  const usable = chunks.length > 0 ? chunks : [title || 'Nội dung LYON Studio'];

  const totalSec = Number(
    firstMatch(userPrompt, [/Thời lượng[^:]*:\s*(\d+)/i])
  );
  const hintedCount = Number(
    firstMatch(userPrompt, [/Số cảnh[^:]*:\s*(\d+)/i])
  );
  const count = Math.min(
    24,
    Math.max(1, hintedCount && hintedCount <= 24 ? hintedCount : usable.length)
  );

  let parts = usable;
  if (usable.length === 1 && count > 1) {
    const sentences = usable[0]
      .split(/(?<=[.!?…])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length >= count) {
      parts = Array.from({ length: count }, (_, i) => {
        const start = Math.round((i * sentences.length) / count);
        const end = Math.round(((i + 1) * sentences.length) / count);
        return sentences.slice(start, end).join(' ');
      }).filter(Boolean);
    }
  }

  const perScene =
    contentType === 'video'
      ? Math.max(
          3,
          Math.min(
            30,
            Math.round((Number.isFinite(totalSec) && totalSec > 0 ? totalSec : parts.length * 8) / parts.length)
          )
        )
      : 4;

  const scenes: VideoScene[] = parts.slice(0, 24).map((chunk, index) => {
    const spoken = chunk.replace(/\s+/g, ' ').trim().slice(0, 280);
    const visualText = toScreenCopy(spoken, title || 'LYON Studio');
    return {
      sceneId: index + 1,
      visualText,
      voiceoverText: contentType === 'video' ? spoken || visualText : '',
      motionType: KINETIC_MOTIONS[index % KINETIC_MOTIONS.length],
      duration: Math.min(7, Math.max(4, perScene)),
    };
  });

  return assertVideoScript({ title, language: 'vi', scenes });
}

function canCallConfiguredLlm(): boolean {
  const def = getProviderDef(getProvider());
  if (def.keyOptional) return true;
  const key = getApiKeySafe();
  return Boolean(key && !key.includes('•') && !key.includes('...'));
}

/**
 * Ưu tiên kịch bản local khi chưa có API key.
 * Có key thì thử LLM, lỗi thì vẫn xuất bằng storyboard local.
 */
export async function resolveVideoScript(
  userPrompt: string,
  contentType: ContentType,
  llmPrompt?: string
): Promise<VideoScript> {
  const local = buildLocalVideoScript(userPrompt, contentType);
  if (!canCallConfiguredLlm()) {
    return local;
  }
  try {
    // Keep Studio responsive: nếu LLM quá chậm/treo thì fallback sang storyboard local
    const timeoutMs = 25_000;
    const llmPromise = generateVideoScript(llmPrompt ?? userPrompt, contentType);
    const timed = await Promise.race([
      llmPromise,
      new Promise<never>((_resolve, reject) =>
        setTimeout(
          () => reject(new Error(`LLM timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
    return timed;
  } catch {
    return local;
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
    `Yêu cầu của người dùng:\n${userPrompt.trim()}`,
    '',
    'Chỉ trả về một object JSON. Mọi câu chữ trong JSON phải là tiếng Việt.',
  ].join('\n');

  let rawText = '';
  let providerLabel = 'LLM';
  try {
    const result = await completeChatWithFallback({
      system,
      user,
      preferJson: true,
    });
    rawText = result.text;
    providerLabel = result.providerLabel;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${providerLabel} không gọi được API: ${message}`);
  }

  if (!rawText?.trim()) {
    throw new Error(`${providerLabel} không trả về nội dung.`);
  }

  try {
    const jsonText = extractJsonPayload(rawText);
    const parsed: unknown = JSON.parse(jsonText);
    return assertVideoScript(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        `Không đọc được bảng cảnh JSON từ ${providerLabel}.`,
        message,
        `Nội dung gốc (rút gọn): ${rawText.slice(0, 500)}`,
      ].join('\n')
    );
  }
}

export async function normalizeStudioForm(input: {
  templateType: StudioTemplateType;
  brief: string;
  fieldValues?: Record<string, string>;
  parts?: ScriptPart[];
  brandName?: string;
  skillBrief?: string;
  fileLabel?: string;
  purpose?: string;
}): Promise<{
  title: string;
  fieldValues: Record<string, string>;
  parts: ScriptPart[];
}> {
  if (!canCallConfiguredLlm()) {
    throw new Error(
      'Chưa có API key. Điền từng ô form bằng tay, hoặc thêm key trong Cài đặt.'
    );
  }
  const existing = (input.parts ?? [])
    .map((part, index) => `${index + 1}. [${part.role}] ${part.title} — ${part.body}`)
    .join('\n');
  const system = [
    'Bạn là biên tập LYON Studio. Chỉ tiếng Việt có dấu.',
    'Điền đúng form JSON, không markdown.',
    'Schema: {"title": string, "fieldValues": {"title": string}, "parts": [{"id": string, "role": "hook|body|cta|slide|section|item", "title": string, "body": string, "notes": string}]}',
    'title và mỗi part.title/body phải ngắn, đúng loại mẫu và đúng file xuất.',
    'Không bịa số liệu. Giữ ô user đã viết nếu hợp lý.',
    input.fileLabel
      ? `File xuất của mẫu này là ${input.fileLabel} — viết chữ vừa khít file đó, không viết như loại khác.`
      : '',
    input.purpose ? `Mẫu dành cho: ${input.purpose}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const user = [
    `Loại mẫu: ${input.templateType}`,
    input.brandName ? `Thương hiệu: ${input.brandName}` : '',
    input.skillBrief
      ? `=== BỐ CỤC THIẾT KẾ (html-anything) ===\n${input.skillBrief}`
      : '',
    `Brief / nháp:\n${input.brief.trim() || '(trống)'}`,
    `Tiêu đề hiện có: ${input.fieldValues?.title || ''}`,
    existing ? `Các phần hiện có:\n${existing}` : 'Chưa có phần.',
    'Trả về JSON form đã điền, khớp số khung / slide / mục của skill.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const result = await completeChatWithFallback({ system, user, preferJson: true });
  if (!result.text?.trim()) {
    throw new Error(`${result.providerLabel} không trả về form.`);
  }
  const parsed: unknown = JSON.parse(extractJsonPayload(result.text));
  return assertNormalizedForm(parsed);
}

export const llmService = {
  generateVideoScript,
  resolveVideoScript,
  buildLocalVideoScript,
  normalizeStudioForm,
  extractJsonPayload,
  testLlmConnection,
};

export default llmService;
