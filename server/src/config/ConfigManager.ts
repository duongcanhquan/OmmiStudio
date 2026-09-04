import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import {
  defaultModelFor,
  getProviderDef,
  isValidProvider,
  type LlmProviderId,
} from './llm-providers';

export type LlmProvider = LlmProviderId;
export type VoiceRegionSetting = 'north' | 'south';

export interface AppSettings {
  llm: {
    provider: LlmProvider;
    apiKey: string;
    model: string;
    /** OpenAI-compatible / Anthropic / custom API root */
    baseUrl: string;
    /** Fallback provider when primary fails (e.g. "gemini", "openai") */
    fallbackProvider?: LlmProvider;
    fallbackApiKey?: string;
    fallbackModel?: string;
    fallbackBaseUrl?: string;
  };
  drive: {
    enabled: boolean;
    /** Raw service-account JSON string pasted from the UI */
    serviceAccountJson: string;
    folderId: string;
  };
  system: {
    defaultVoice: VoiceRegionSetting;
  };
  research: {
    firecrawlKey: string;
    firecrawlBaseUrl: string;
  };
}

/** Public shape returned by GET /settings (secrets masked). */
export interface PublicAppSettings {
  llm: {
    provider: LlmProvider;
    apiKey: string;
    apiKeySet: boolean;
    model: string;
    baseUrl: string;
    fallbackProvider?: LlmProvider;
    fallbackApiKey?: string;
    fallbackApiKeySet?: boolean;
    fallbackModel?: string;
    fallbackBaseUrl?: string;
  };
  drive: {
    enabled: boolean;
    serviceAccountJson: string;
    serviceAccountSet: boolean;
    folderId: string;
  };
  system: {
    defaultVoice: VoiceRegionSetting;
  };
  research: {
    firecrawlKey: string;
    firecrawlKeySet: boolean;
    firecrawlBaseUrl: string;
  };
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
/** Legacy path from earlier builds — migrated once into data/settings.json */
const LEGACY_SETTINGS_PATH = path.resolve(__dirname, '../../settings.json');

export const DEFAULT_SETTINGS: AppSettings = {
  llm: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-pro',
    baseUrl: '',
  },
  drive: {
    enabled: false,
    serviceAccountJson: '',
    folderId: '',
  },
  system: {
    defaultVoice: 'north',
  },
  research: {
    firecrawlKey: '',
    firecrawlBaseUrl: '',
  },
};

function deepMergeSettings(
  base: AppSettings,
  patch: Partial<AppSettings>
): AppSettings {
  return {
    llm: { ...base.llm, ...(patch.llm ?? {}) },
    drive: { ...base.drive, ...(patch.drive ?? {}) },
    system: { ...base.system, ...(patch.system ?? {}) },
    research: { ...base.research, ...(patch.research ?? {}) },
  };
}

function seedFromEnv(defaults: AppSettings): AppSettings {
  const seeded = structuredClone(defaults);

  if (process.env.GEMINI_API_KEY?.trim()) {
    seeded.llm.apiKey = process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GEMINI_MODEL?.trim()) {
    seeded.llm.model = process.env.GEMINI_MODEL.trim();
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    seeded.llm.apiKey = process.env.OPENAI_API_KEY.trim();
    seeded.llm.provider = 'openai';
    seeded.llm.model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  }
  if (process.env.LLM_BASE_URL?.trim()) {
    seeded.llm.baseUrl = process.env.LLM_BASE_URL.trim();
  }

  if (process.env.FIRECRAWL_KEY?.trim()) {
    seeded.research.firecrawlKey = process.env.FIRECRAWL_KEY.trim();
  }
  if (process.env.FIRECRAWL_BASE_URL?.trim()) {
    seeded.research.firecrawlBaseUrl = process.env.FIRECRAWL_BASE_URL.trim();
  }

  if (process.env.GDRIVE_FOLDER_ID?.trim()) {
    seeded.drive.folderId = process.env.GDRIVE_FOLDER_ID.trim();
    seeded.drive.enabled = true;
  }

  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credsPath) {
    const resolved = path.isAbsolute(credsPath)
      ? credsPath
      : path.resolve(__dirname, '../..', credsPath);
    try {
      if (fs.existsSync(resolved)) {
        seeded.drive.serviceAccountJson = fs.readFileSync(resolved, 'utf-8');
        seeded.drive.enabled = true;
      }
    } catch {
      // ignore
    }
  }

  return seeded;
}

/** Mask like `AIza...x9K2` / `sk-...abcd` for UI display. */
export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}...****`;
  const prefix = trimmed.slice(0, Math.min(4, trimmed.length - 4));
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

function isMaskedSecret(value: string): boolean {
  const v = value.trim();
  return (
    !v ||
    v.includes('•') ||
    v.includes('...') ||
    v === '[REDACTED]' ||
    /^\[đã lưu/i.test(v)
  );
}

function normalizeProvider(raw: string | undefined): LlmProvider {
  if (raw && isValidProvider(raw)) return raw;
  return 'gemini';
}

/**
 * Persistent settings store → server/data/settings.json
 * Non-technical users configure everything via the Settings UI.
 */
export class ConfigManager {
  private cache: AppSettings | null = null;
  private listeners = new Set<() => void>();

  getSettingsPath(): string {
    return SETTINGS_PATH;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('[ConfigManager] listener error:', err);
      }
    }
  }

  /** Preferred alias used by services. */
  getConfig(): AppSettings {
    return this.get();
  }

  async load(): Promise<AppSettings> {
    if (this.cache) return this.cache;

    // Migrate legacy server/settings.json → data/settings.json once
    if (!fs.existsSync(SETTINGS_PATH) && fs.existsSync(LEGACY_SETTINGS_PATH)) {
      try {
        await fsp.mkdir(DATA_DIR, { recursive: true });
        await fsp.copyFile(LEGACY_SETTINGS_PATH, SETTINGS_PATH);
      } catch (err) {
        console.warn('[ConfigManager] legacy migrate failed:', err);
      }
    }

    try {
      const raw = await fsp.readFile(SETTINGS_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      if (parsed.llm?.provider) {
        parsed.llm.provider = normalizeProvider(
          String(parsed.llm.provider)
        );
      }
      this.cache = deepMergeSettings(DEFAULT_SETTINGS, parsed);
      return this.cache;
    } catch {
      const seeded = seedFromEnv(DEFAULT_SETTINGS);
      await this.save(seeded);
      return seeded;
    }
  }

  get(): AppSettings {
    if (!this.cache) {
      try {
        const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        if (parsed.llm?.provider) {
          parsed.llm.provider = normalizeProvider(
            String(parsed.llm.provider)
          );
        }
        this.cache = deepMergeSettings(DEFAULT_SETTINGS, parsed);
      } catch {
        this.cache = seedFromEnv(DEFAULT_SETTINGS);
      }
    }
    return this.cache;
  }

  async save(next: AppSettings): Promise<AppSettings> {
    const normalized = deepMergeSettings(DEFAULT_SETTINGS, next);
    normalized.llm.provider = normalizeProvider(normalized.llm.provider);
    if (!normalized.llm.model?.trim()) {
      normalized.llm.model = defaultModelFor(normalized.llm.provider);
    }
    // Fill default baseUrl when provider needs one and user left empty
    const def = getProviderDef(normalized.llm.provider);
    if (
      def.needsBaseUrl &&
      !normalized.llm.baseUrl.trim() &&
      def.defaultBaseUrl
    ) {
      normalized.llm.baseUrl = def.defaultBaseUrl;
    }
    await fsp.mkdir(DATA_DIR, { recursive: true });
    await fsp.writeFile(
      SETTINGS_PATH,
      JSON.stringify(normalized, null, 2),
      'utf-8'
    );
    this.cache = normalized;
    this.emitChange();
    return normalized;
  }

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.load();
    const merged = deepMergeSettings(current, patch);

    if (patch.llm?.apiKey !== undefined && isMaskedSecret(patch.llm.apiKey)) {
      merged.llm.apiKey = current.llm.apiKey;
    }

    if (patch.llm?.fallbackApiKey !== undefined && isMaskedSecret(patch.llm.fallbackApiKey ?? '')) {
      merged.llm.fallbackApiKey = current.llm.fallbackApiKey ?? '';
    }

    if (
      patch.drive?.serviceAccountJson !== undefined &&
      isMaskedSecret(patch.drive.serviceAccountJson)
    ) {
      merged.drive.serviceAccountJson = current.drive.serviceAccountJson;
    }

    if (!merged.research) {
      merged.research = { ...DEFAULT_SETTINGS.research };
    }
    if (
      patch.research?.firecrawlKey !== undefined &&
      isMaskedSecret(patch.research.firecrawlKey)
    ) {
      merged.research.firecrawlKey = current.research?.firecrawlKey ?? '';
    }

    return this.save(merged);
  }

  toPublic(settings?: AppSettings): PublicAppSettings {
    const s = settings ?? this.get();
    const keySet = Boolean(s.llm.apiKey.trim());
    const saSet = Boolean(s.drive.serviceAccountJson.trim());
    const provider = normalizeProvider(s.llm.provider);
    const fbKeySet = Boolean(s.llm.fallbackApiKey?.trim());
    const research = s.research ?? DEFAULT_SETTINGS.research;
    const fcSet = Boolean(research.firecrawlKey.trim());
    return {
      llm: {
        provider,
        apiKey: keySet ? maskSecret(s.llm.apiKey) : '',
        apiKeySet: keySet,
        model: s.llm.model,
        baseUrl: s.llm.baseUrl || getProviderDef(provider).defaultBaseUrl,
        fallbackProvider: s.llm.fallbackProvider,
        fallbackApiKey: fbKeySet ? maskSecret(s.llm.fallbackApiKey!) : '',
        fallbackApiKeySet: fbKeySet,
        fallbackModel: s.llm.fallbackModel,
        fallbackBaseUrl: s.llm.fallbackBaseUrl,
      },
      drive: {
        enabled: s.drive.enabled,
        serviceAccountJson: saSet ? '[REDACTED — đã lưu an toàn]' : '',
        serviceAccountSet: saSet,
        folderId: s.drive.folderId,
      },
      system: {
        defaultVoice: s.system.defaultVoice,
      },
      research: {
        firecrawlKey: fcSet ? maskSecret(research.firecrawlKey) : '',
        firecrawlKeySet: fcSet,
        firecrawlBaseUrl: research.firecrawlBaseUrl,
      },
    };
  }
}

export const configManager = new ConfigManager();

export default configManager;
