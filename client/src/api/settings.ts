import axios from 'axios'
import type { LlmProvider } from '../lib/llmProviders'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() || '/api/v1'

export type { LlmProvider }
export type VoiceRegionSetting = 'north' | 'south'

export interface PublicAppSettings {
  llm: {
    provider: LlmProvider
    apiKey: string
    apiKeySet: boolean
    model: string
    baseUrl: string
    fallbackProvider?: LlmProvider
    fallbackApiKey?: string
    fallbackApiKeySet?: boolean
    fallbackModel?: string
    fallbackBaseUrl?: string
  }
  drive: {
    enabled: boolean
    serviceAccountJson: string
    serviceAccountSet: boolean
    folderId: string
  }
  system: {
    defaultVoice: VoiceRegionSetting
  }
  research?: {
    firecrawlKey: string
    firecrawlKeySet: boolean
    firecrawlBaseUrl: string
  }
}

export interface SettingsFormValues {
  llm: {
    provider: LlmProvider
    apiKey: string
    model: string
    baseUrl: string
    fallbackProvider?: LlmProvider
    fallbackApiKey?: string
    fallbackModel?: string
    fallbackBaseUrl?: string
  }
  drive: {
    enabled: boolean
    serviceAccountJson: string
    folderId: string
  }
  system: {
    defaultVoice: VoiceRegionSetting
  }
  research?: {
    firecrawlKey: string
    firecrawlBaseUrl?: string
  }
}

const settingsApi = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

function unwrapError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; error?: string }
      | undefined
    return data?.message || data?.error || err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

export async function fetchSettings(): Promise<PublicAppSettings> {
  const { data } = await settingsApi.get<{
    success: boolean
    settings: PublicAppSettings
  }>('/settings')
  return data.settings
}

export async function saveSettings(
  payload: SettingsFormValues
): Promise<PublicAppSettings> {
  const { data } = await settingsApi.post<{
    success: boolean
    settings: PublicAppSettings
    message?: string
    error?: string
  }>('/settings', payload)
  if (!data.success) {
    throw new Error(data.error || 'Không lưu được cài đặt')
  }
  return data.settings
}

export async function fetchOllamaModels(
  baseUrl?: string
): Promise<string[]> {
  const { data } = await settingsApi.get<{
    success: boolean
    models?: string[]
    error?: string
  }>('/settings/ollama-models', {
    params: baseUrl ? { baseUrl } : undefined,
    timeout: 8_000,
  })
  return data.models ?? []
}

export async function testLlmConnection(body: {
  apiKey?: string
  model?: string
  provider?: string
  baseUrl?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await settingsApi.post<{
      success: boolean
      message: string
      error?: string
    }>('/settings/test-llm', body)
    return {
      success: data.success,
      message: data.message || data.error || 'Xong',
    }
  } catch (err) {
    return { success: false, message: unwrapError(err, 'Kiểm tra LLM thất bại') }
  }
}

export async function testDriveConnection(body: {
  serviceAccountJson?: string
  folderId?: string
}): Promise<{ success: boolean; message: string }> {
  try {
    const { data } = await settingsApi.post<{
      success: boolean
      message: string
      error?: string
    }>('/settings/test-drive', body)
    return {
      success: data.success,
      message: data.message || data.error || 'Xong',
    }
  } catch (err) {
    return {
      success: false,
      message: unwrapError(err, 'Kiểm tra Drive thất bại'),
    }
  }
}
