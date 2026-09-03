/**
 * Client-side mirror of server LLM provider catalog (Settings UI).
 */

export type LlmApiStyle = 'gemini' | 'openai' | 'anthropic'

export type LlmProvider =
  | 'gemini'
  | 'google-antigravity'
  | 'openai'
  | 'deepseek'
  | 'claude'
  | 'groq'
  | 'mistral'
  | 'openrouter'
  | 'together'
  | 'fireworks'
  | 'xai'
  | 'perplexity'
  | 'cohere'
  | 'azure-openai'
  | 'ollama'
  | 'lmstudio'
  | 'custom'

export interface LlmProviderDef {
  id: LlmProvider
  label: string
  apiStyle: LlmApiStyle
  defaultBaseUrl: string
  models: string[]
  keyHelpUrl: string
  keyHelpLabel: string
  needsBaseUrl?: boolean
  keyOptional?: boolean
  hint?: string
}

export const LLM_PROVIDERS: LlmProviderDef[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    apiStyle: 'gemini',
    defaultBaseUrl: '',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-2.5-pro-preview-05-06',
    ],
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    keyHelpLabel: 'Google AI Studio',
    hint: 'Khuyến nghị — đã tích hợp sẵn trong LYON Studio.',
  },
  {
    id: 'google-antigravity',
    label: 'Google Antigravity',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    keyHelpLabel: 'Google AI Studio (Antigravity)',
    needsBaseUrl: true,
    hint: 'Cổng tương thích OpenAI của Google. Có thể đổi địa chỉ máy chủ.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpLabel: 'OpenAI Platform',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyHelpUrl: 'https://platform.deepseek.com/api_keys',
    keyHelpLabel: 'DeepSeek Platform',
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    apiStyle: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
    ],
    keyHelpUrl: 'https://console.anthropic.com/',
    keyHelpLabel: 'Anthropic Console',
  },
  {
    id: 'groq',
    label: 'Groq',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ],
    keyHelpUrl: 'https://console.groq.com/keys',
    keyHelpLabel: 'Groq Console',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    models: [
      'mistral-large-latest',
      'mistral-small-latest',
      'open-mistral-nemo',
    ],
    keyHelpUrl: 'https://console.mistral.ai/api-keys/',
    keyHelpLabel: 'Mistral Console',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash-001',
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-chat',
    ],
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyHelpLabel: 'OpenRouter Keys',
    hint: 'Một key — nhiều model từ nhiều hãng.',
  },
  {
    id: 'together',
    label: 'Together AI',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    models: [
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    ],
    keyHelpUrl: 'https://api.together.xyz/settings/api-keys',
    keyHelpLabel: 'Together API Keys',
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1',
    models: [
      'accounts/fireworks/models/llama-v3p1-70b-instruct',
      'accounts/fireworks/models/llama-v3p1-8b-instruct',
    ],
    keyHelpUrl: 'https://fireworks.ai/account/api-keys',
    keyHelpLabel: 'Fireworks API Keys',
  },
  {
    id: 'xai',
    label: 'xAI Grok',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.x.ai/v1',
    models: ['grok-2-latest', 'grok-3-mini', 'grok-3'],
    keyHelpUrl: 'https://console.x.ai/',
    keyHelpLabel: 'xAI Console',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.perplexity.ai',
    models: ['sonar', 'sonar-pro', 'sonar-reasoning'],
    keyHelpUrl: 'https://www.perplexity.ai/settings/api',
    keyHelpLabel: 'Perplexity API',
  },
  {
    id: 'cohere',
    label: 'Cohere',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://api.cohere.ai/compatibility/v1',
    models: ['command-r-plus', 'command-r', 'command-a-03-2025'],
    keyHelpUrl: 'https://dashboard.cohere.com/api-keys',
    keyHelpLabel: 'Cohere Dashboard',
  },
  {
    id: 'azure-openai',
    label: 'Azure OpenAI',
    apiStyle: 'openai',
    defaultBaseUrl: '',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
    keyHelpUrl:
      'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI',
    keyHelpLabel: 'Azure Portal',
    needsBaseUrl: true,
    hint: 'Điền địa chỉ máy chủ Azure của bạn.',
  },
  {
    id: 'ollama',
    label: 'Ollama (trên máy)',
    apiStyle: 'openai',
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    models: [
      'qwen3.8:27b',
      'llama3.1:8b',
      'llama3.2',
      'llama3.2:latest',
      'qwen2.5',
      'mistral',
      'gemma2',
    ],
    keyHelpUrl: 'https://ollama.com/',
    keyHelpLabel: 'Ollama docs',
    needsBaseUrl: true,
    keyOptional: true,
    hint: 'Chạy trên máy — khóa API có thể để trống. Ưu tiên qwen3.8:27b nếu đã pull (~18GB, máy 32GB+ RAM).',
  },
  {
    id: 'lmstudio',
    label: 'LM Studio (trên máy)',
    apiStyle: 'openai',
    defaultBaseUrl: 'http://127.0.0.1:1234/v1',
    models: ['local-model'],
    keyHelpUrl: 'https://lmstudio.ai/',
    keyHelpLabel: 'LM Studio',
    needsBaseUrl: true,
    keyOptional: true,
  },
  {
    id: 'custom',
    label: 'Tùy chỉnh (tương thích OpenAI)',
    apiStyle: 'openai',
    defaultBaseUrl: '',
    models: ['gpt-4o-mini', 'custom-model'],
    keyHelpUrl: 'https://platform.openai.com/docs/api-reference',
    keyHelpLabel: 'OpenAI-compatible docs',
    needsBaseUrl: true,
    hint: 'Mọi cổng tương thích /v1/chat/completions.',
  },
]

export function getProviderDef(id: string | undefined): LlmProviderDef {
  return LLM_PROVIDERS.find((p) => p.id === id) ?? LLM_PROVIDERS[0]
}
