/**
 * Catalog LLM providers for OmniStudio Settings + LLMService.
 * OpenAI-compatible providers share the Chat Completions protocol.
 */

export type LlmApiStyle = 'gemini' | 'openai' | 'anthropic';

export type LlmProviderId =
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
  | 'custom';

export interface LlmProviderDef {
  id: LlmProviderId;
  label: string;
  apiStyle: LlmApiStyle;
  /** Default Chat Completions / API root (no trailing /chat/completions) */
  defaultBaseUrl: string;
  models: string[];
  keyHelpUrl: string;
  keyHelpLabel: string;
  /** If true, Settings shows Base URL field */
  needsBaseUrl?: boolean;
  /** Ollama/LM Studio often need no cloud key */
  keyOptional?: boolean;
  hint?: string;
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
    hint: 'Khuyến nghị — đã tích hợp sẵn trong OmniStudio.',
  },
  {
    id: 'google-antigravity',
    label: 'Google Antigravity',
    apiStyle: 'openai',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    keyHelpUrl: 'https://aistudio.google.com/apikey',
    keyHelpLabel: 'Google AI Studio (Antigravity / OpenAI-compat)',
    needsBaseUrl: true,
    hint: 'Endpoint kiểu OpenAI của Google Generative Language. Có thể đổi Base URL nếu dùng gateway riêng.',
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
    hint: 'Base URL dạng https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT',
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    apiStyle: 'openai',
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    models: ['llama3.2', 'qwen2.5', 'mistral', 'gemma2'],
    keyHelpUrl: 'https://ollama.com/',
    keyHelpLabel: 'Ollama docs',
    needsBaseUrl: true,
    keyOptional: true,
    hint: 'Chạy local — API key có thể để trống hoặc ollama.',
  },
  {
    id: 'lmstudio',
    label: 'LM Studio (local)',
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
    label: 'Custom (OpenAI-compatible)',
    apiStyle: 'openai',
    defaultBaseUrl: '',
    models: ['gpt-4o-mini', 'custom-model'],
    keyHelpUrl: 'https://platform.openai.com/docs/api-reference',
    keyHelpLabel: 'OpenAI-compatible docs',
    needsBaseUrl: true,
    hint: 'Mọi gateway tương thích /v1/chat/completions.',
  },
];

export const LLM_PROVIDER_IDS: LlmProviderId[] = LLM_PROVIDERS.map((p) => p.id);

export function getProviderDef(
  id: string | undefined
): LlmProviderDef {
  return (
    LLM_PROVIDERS.find((p) => p.id === id) ??
    LLM_PROVIDERS[0]
  );
}

export function isValidProvider(id: string): id is LlmProviderId {
  return LLM_PROVIDER_IDS.includes(id as LlmProviderId);
}

export function defaultModelFor(id: LlmProviderId): string {
  return getProviderDef(id).models[0] ?? 'gemini-1.5-pro';
}
