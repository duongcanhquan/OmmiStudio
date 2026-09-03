import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  CheckCircle2,
  Cloud,
  Cpu,
  ExternalLink,
  Loader2,
  Save,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react'
import {
  fetchSettings,
  saveSettings,
  testDriveConnection,
  testLlmConnection,
  type LlmProvider,
  type PublicAppSettings,
  type SettingsFormValues,
} from '../api/settings'
import { fetchNexuTools, type NexuRepoStatus } from '../api/engine'
import { getProviderDef, LLM_PROVIDERS } from '../lib/llmProviders'
import { cn } from '../lib/utils'

type TabId = 'llm' | 'drive' | 'system'

const TABS: {
  id: TabId
  label: string
  description: string
  icon: typeof Cpu
}[] = [
  {
    id: 'llm',
    label: 'Nhà cung cấp AI',
    description: 'OpenAI · DeepSeek · Gemini…',
    icon: Cpu,
  },
  {
    id: 'drive',
    label: 'Lưu trữ đám mây',
    description: 'Google Drive',
    icon: Cloud,
  },
  {
    id: 'system',
    label: 'Hệ thống',
    description: 'Giọng đọc · repo nexu',
    icon: Settings2,
  },
]

function looksMasked(value: string): boolean {
  const v = value.trim()
  return (
    !v ||
    v.includes('•') ||
    v.includes('...') ||
    v.includes('[REDACTED]') ||
    /^\[đã lưu/i.test(v)
  )
}

interface SettingsPageProps {
  onNotify?: (message: string, isError?: boolean) => void
}

export function SettingsPage({ onNotify }: SettingsPageProps) {
  const [tab, setTab] = useState<TabId>('llm')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<'llm' | 'drive' | null>(null)
  const [testMsg, setTestMsg] = useState<{
    target: 'llm' | 'drive'
    ok: boolean
    text: string
  } | null>(null)
  const [meta, setMeta] = useState<{
    apiKeySet: boolean
    serviceAccountSet: boolean
  }>({ apiKeySet: false, serviceAccountSet: false })
  const [nexuRepos, setNexuRepos] = useState<NexuRepoStatus[]>([])
  const [nexuReady, setNexuReady] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<SettingsFormValues>({
    defaultValues: {
      llm: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-1.5-pro',
        baseUrl: '',
      },
      drive: { enabled: false, serviceAccountJson: '', folderId: '' },
      system: { defaultVoice: 'north' },
    },
  })

  const provider = watch('llm.provider')
  const selectedModel = watch('llm.model')
  const driveEnabled = watch('drive.enabled')

  const providerDef = useMemo(() => getProviderDef(provider), [provider])
  const modelOptions = providerDef.models
  const showBaseUrl =
    Boolean(providerDef.needsBaseUrl) ||
    providerDef.apiStyle === 'openai' ||
    providerDef.apiStyle === 'anthropic'

  const applyPublicSettings = useCallback(
    (settings: PublicAppSettings) => {
      setMeta({
        apiKeySet: settings.llm.apiKeySet,
        serviceAccountSet: settings.drive.serviceAccountSet,
      })
      reset({
        llm: {
          provider: settings.llm.provider,
          apiKey: settings.llm.apiKeySet ? settings.llm.apiKey : '',
          model: settings.llm.model,
          baseUrl:
            settings.llm.baseUrl ||
            getProviderDef(settings.llm.provider).defaultBaseUrl,
          fallbackProvider:
            settings.llm.fallbackProvider ?? ('' as LlmProvider),
          fallbackApiKey: settings.llm.fallbackApiKeySet
            ? settings.llm.fallbackApiKey ?? ''
            : '',
          fallbackModel: settings.llm.fallbackModel ?? '',
          fallbackBaseUrl: settings.llm.fallbackBaseUrl ?? '',
        },
        drive: {
          enabled: settings.drive.enabled,
          serviceAccountJson: settings.drive.serviceAccountSet
            ? ''
            : settings.drive.serviceAccountJson,
          folderId: settings.drive.folderId,
        },
        system: {
          defaultVoice: settings.system.defaultVoice,
        },
      })
    },
    [reset]
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [settings, tools] = await Promise.all([
          fetchSettings(),
          fetchNexuTools().catch(() => ({
            ready: false,
            repos: [] as NexuRepoStatus[],
            videoTemplates: [],
          })),
        ])
        if (cancelled) return
        applyPublicSettings(settings)
        setNexuRepos(tools.repos)
        setNexuReady(tools.ready)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Không tải được cài đặt'
        onNotify?.(message, true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [onNotify, applyPublicSettings])

  function onProviderChange(next: LlmProvider) {
    setValue('llm.provider', next, { shouldDirty: true })
    const def = getProviderDef(next)
    const current = getValues('llm.model')
    if (!def.models.includes(current)) {
      setValue('llm.model', def.models[0], { shouldDirty: true })
    }
    setValue('llm.baseUrl', def.defaultBaseUrl, { shouldDirty: true })
  }

  async function onSave(values: SettingsFormValues) {
    setSaving(true)
    try {
      const payload: SettingsFormValues = {
        ...values,
        llm: {
          ...values.llm,
          baseUrl: values.llm.baseUrl?.trim() || '',
          // Keep masked display string so ConfigManager preserves the real key
          apiKey: looksMasked(values.llm.apiKey)
            ? values.llm.apiKey || (meta.apiKeySet ? '...' : '')
            : values.llm.apiKey,
        },
        drive: {
          ...values.drive,
          serviceAccountJson:
            !values.drive.serviceAccountJson.trim() && meta.serviceAccountSet
              ? '[REDACTED — đã lưu an toàn]'
              : values.drive.serviceAccountJson,
        },
      }
      const saved = await saveSettings(payload)
      applyPublicSettings(saved)
      onNotify?.('Đã lưu cài đặt thành công.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lưu thất bại'
      onNotify?.(message, true)
    } finally {
      setSaving(false)
    }
  }

  async function onTestLlm() {
    setTesting('llm')
    setTestMsg(null)
    const values = getValues()
    try {
      const result = await testLlmConnection({
        provider: values.llm.provider,
        model: values.llm.model,
        baseUrl: values.llm.baseUrl?.trim() || undefined,
        apiKey: looksMasked(values.llm.apiKey)
          ? undefined
          : values.llm.apiKey,
      })
      setTestMsg({ target: 'llm', ok: result.success, text: result.message })
      onNotify?.(result.message, !result.success)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kiểm tra thất bại'
      setTestMsg({ target: 'llm', ok: false, text: message })
      onNotify?.(message, true)
    } finally {
      setTesting(null)
    }
  }

  async function onTestDrive() {
    setTesting('drive')
    setTestMsg(null)
    const values = getValues()
    try {
      const result = await testDriveConnection({
        folderId: values.drive.folderId,
        serviceAccountJson: values.drive.serviceAccountJson.trim()
          ? values.drive.serviceAccountJson
          : undefined,
      })
      setTestMsg({ target: 'drive', ok: result.success, text: result.message })
      onNotify?.(result.message, !result.success)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kiểm tra thất bại'
      setTestMsg({ target: 'drive', ok: false, text: message })
      onNotify?.(message, true)
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-10 text-sm text-zinc-400">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Đang tải cài đặt…
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 pb-28 lg:flex-row lg:p-8 lg:pb-28">
        {/* Left vertical tabs */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="mb-5">
            <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Cấu hình
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
              Cài đặt
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Cấu hình AI, Drive và giọng đọc — không cần chỉnh file{' '}
              <code className="text-zinc-300">.env</code>.
            </p>
          </div>

          <nav
            className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
            aria-label="Mục cài đặt"
          >
            {TABS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex min-h-12 min-w-[11rem] cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors lg:min-w-0',
                  tab === id
                    ? 'border-blue-500/40 bg-blue-500/10 text-zinc-50'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100'
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    tab === id ? 'text-blue-400' : 'text-zinc-500'
                  )}
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <form
          className="studio-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto"
          onSubmit={handleSubmit(onSave)}
        >
          {tab === 'llm' && (
            <>
              <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
              <header>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Nhà cung cấp AI (tùy chọn)
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Không bắt buộc nếu bạn đã tự viết kịch bản — xuất bản trên máy
                  (HTML / lời đọc / MP4). Khóa API chỉ cần khi muốn AI viết hoặc
                  chỉnh kịch bản (Gemini, OpenAI, DeepSeek…). Ollama / LM Studio
                  là mô hình trên máy, không cần khóa đám mây.
                </p>
              </header>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Nhà cung cấp
                </label>
                <select
                  className={fieldClass}
                  value={provider}
                  onChange={(e) =>
                    onProviderChange(e.target.value as LlmProvider)
                  }
                >
                  {LLM_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {providerDef.hint && (
                  <p className="text-xs text-zinc-500">{providerDef.hint}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Khóa API
                  {providerDef.keyOptional && (
                    <span className="ml-1 font-normal text-zinc-500">
                      (tuỳ chọn)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder={
                    meta.apiKeySet
                      ? 'Đã lưu — nhập key mới nếu muốn đổi'
                      : providerDef.keyOptional
                        ? 'Có thể để trống (chạy trên máy)'
                        : 'Dán khóa API vào đây'
                  }
                  className={fieldClass}
                  {...register('llm.apiKey')}
                />
                <p className="text-xs leading-relaxed text-zinc-500">
                  Nhận khóa API tại{' '}
                  <a
                    href={providerDef.keyHelpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {providerDef.keyHelpLabel}
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                  .
                </p>
                {meta.apiKeySet && (
                  <p className="text-xs text-emerald-400/90">
                    Key đã được lưu an toàn. Để trống hoặc giữ dạng đã che nếu
                    không muốn đổi.
                  </p>
                )}
              </div>

              {showBaseUrl && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">
                    Địa chỉ máy chủ
                    {!providerDef.needsBaseUrl && (
                      <span className="ml-1 font-normal text-zinc-500">
                        (tuỳ chọn)
                      </span>
                    )}
                  </label>
                  <input
                    className={cn(fieldClass, 'font-mono text-xs')}
                    placeholder={
                      providerDef.defaultBaseUrl ||
                      'https://api.example.com/v1'
                    }
                    {...register('llm.baseUrl')}
                  />
                  <p className="text-xs text-zinc-500">
                    Địa chỉ gốc (không kèm{' '}
                    <code className="text-zinc-400">/chat/completions</code>
                    ). Đổi khi dùng máy chủ trung gian, Azure, Ollama hoặc cổng riêng.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Mô hình
                </label>
                <select className={fieldClass} {...register('llm.model')}>
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {selectedModel && !modelOptions.includes(selectedModel) && (
                    <option value={selectedModel}>
                      {selectedModel} (đã lưu)
                    </option>
                  )}
                </select>
                <p className="text-xs text-zinc-500">
                  Có thể chọn model có sẵn hoặc giữ model tùy chỉnh đã lưu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={testing === 'llm'}
                  onClick={() => void onTestLlm()}
                  className={secondaryBtn}
                >
                  {testing === 'llm' ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-4" aria-hidden />
                  )}
                  Kiểm tra kết nối
                </button>
                {testMsg?.target === 'llm' && (
                  <StatusPill ok={testMsg.ok} text={testMsg.text} />
                )}
              </div>
            </section>

            {/* ─── Fallback Provider ─────────────────────────── */}
            <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
              <header>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Nhà cung cấp dự phòng (Fallback)
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Khi nhà cung cấp chính thất bại hoặc quá chậm, hệ thống tự động chuyển sang provider này.
                  Ví dụ: dùng Ollama làm chính, OpenAI/Gemini làm dự phòng cho tác vụ phức tạp.
                </p>
              </header>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Nhà cung cấp dự phòng
                  <span className="ml-1 font-normal text-zinc-500">(tuỳ chọn)</span>
                </label>
                <select
                  className={fieldClass}
                  {...register('llm.fallbackProvider')}
                >
                  <option value="">— Không dùng fallback —</option>
                  {LLM_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Khóa API dự phòng
                  <span className="ml-1 font-normal text-zinc-500">(tuỳ chọn)</span>
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="Dán API key của provider dự phòng"
                  className={fieldClass}
                  {...register('llm.fallbackApiKey')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">
                    Mô hình dự phòng
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="vd: gpt-4o-mini, gemini-1.5-flash"
                    {...register('llm.fallbackModel')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">
                    Base URL dự phòng
                    <span className="ml-1 font-normal text-zinc-500">(nếu cần)</span>
                  </label>
                  <input
                    className={cn(fieldClass, 'font-mono text-xs')}
                    placeholder="https://api.openai.com/v1"
                    {...register('llm.fallbackBaseUrl')}
                  />
                </div>
              </div>
            </section>
            </>
          )}

          {tab === 'drive' && (
            <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
              <header>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Lưu trữ đám mây (Google Drive)
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Tự động tải video/poster lên Drive sau khi render xong.
                </p>
              </header>

              <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-zinc-100">
                    Tự động tải lên Google Drive
                  </span>
                  <span className="block text-xs text-zinc-500">
                    Sau khi tạo xong, đăng tải tệp và xóa bản trên máy
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-5 cursor-pointer accent-blue-500"
                  {...register('drive.enabled')}
                />
              </label>

              <div
                className={cn(
                  'space-y-5 transition-opacity',
                  !driveEnabled && 'pointer-events-none opacity-40'
                )}
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">
                    Tài khoản dịch vụ (JSON)
                  </label>
                  <textarea
                    rows={10}
                    spellCheck={false}
                    placeholder={
                      meta.serviceAccountSet
                        ? 'Đã lưu — chỉ dán JSON mới nếu muốn thay thế'
                        : '{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'
                    }
                    className={cn(
                      fieldClass,
                      'min-h-40 resize-y font-mono text-xs leading-relaxed'
                    )}
                    {...register('drive.serviceAccountJson')}
                  />
                  <p className="text-xs text-zinc-500">
                    Tạo tài khoản dịch vụ trong Google Cloud → Khóa → JSON, rồi
                    dán toàn bộ nội dung tệp vào đây.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">
                    Mã thư mục Google Drive
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
                    {...register('drive.folderId')}
                  />
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Mở thư mục Drive trên trình duyệt. URL dạng{' '}
                    <code className="text-zinc-400">
                      drive.google.com/drive/folders/
                      <span className="text-blue-300">MÃ_THƯ_MỤC</span>
                    </code>
                    — sao chép phần sau{' '}
                    <code className="text-zinc-400">/folders/</code>. Chia sẻ
                    thư mục đó cho email tài khoản dịch vụ (quyền Người chỉnh sửa).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={testing === 'drive' || !driveEnabled}
                    onClick={() => void onTestDrive()}
                    className={secondaryBtn}
                  >
                    {testing === 'drive' ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Cloud className="size-4" aria-hidden />
                    )}
                    Kiểm tra Drive
                  </button>
                  {testMsg?.target === 'drive' && (
                    <StatusPill ok={testMsg.ok} text={testMsg.text} />
                  )}
                </div>
              </div>
            </section>
          )}

          {tab === 'system' && (
            <section className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
              <header>
                <h2 className="text-lg font-semibold text-zinc-50">
                  Tùy chọn hệ thống
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Giọng đọc tiếng Việt mặc định cho lời thuyết minh.
                </p>
              </header>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-200">
                  Vùng giọng mặc định
                </label>
                <select
                  className={fieldClass}
                  {...register('system.defaultVoice')}
                >
                  <option value="north">Miền Bắc — Nam Minh</option>
                  <option value="south">Miền Nam — Hoài My</option>
                </select>
                <p className="text-xs text-zinc-500">
                  Có thể ghi đè khi tạo nội dung trong studio.
                </p>
              </div>

              <div className="space-y-3 border-t border-zinc-800 pt-5">
                <header>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Repo nexu-io {nexuReady ? '· sẵn sàng' : '· thiếu thư mục'}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Studio đọc skill / template / DESIGN.md trên máy. nexu
                    (OpenClaw) là app IM — không render PNG/MP4.
                  </p>
                </header>
                <ul className="space-y-2">
                  {nexuRepos.map((repo) => (
                    <li
                      key={repo.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-100">
                          {repo.name}
                        </p>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wide',
                            repo.present ? 'text-emerald-300' : 'text-amber-300'
                          )}
                        >
                          {repo.present ? 'Có' : 'Thiếu'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400">{repo.role}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {repo.usedFor}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </form>
      </div>

      {/* Sticky save bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 border-t border-zinc-800/80 bg-zinc-950/90 px-6 py-4 backdrop-blur-md lg:px-8">
        <div className="pointer-events-auto ml-auto flex max-w-full items-center justify-end gap-3">
          {isDirty && (
            <span className="mr-auto hidden text-xs text-amber-300/90 sm:inline">
              Có thay đổi chưa lưu
            </span>
          )}
          <button
            type="button"
            disabled={saving || !isDirty}
            onClick={handleSubmit(onSave)}
            className={cn(
              'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors',
              'hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p
      className={cn(
        'inline-flex max-w-xl items-start gap-2 rounded-lg border px-3 py-2 text-xs',
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-red-500/30 bg-red-500/10 text-red-200'
      )}
      role="status"
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      ) : (
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      )}
      <span className="break-words">{text}</span>
    </p>
  )
}

const fieldClass = cn(
  'min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100',
  'placeholder:text-zinc-500',
  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
)

const secondaryBtn = cn(
  'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100',
  'transition-colors hover:border-zinc-500 hover:bg-zinc-800',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

export default SettingsPage
