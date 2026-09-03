import { Loader2, Sparkles } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import {
  fetchBrands,
  fetchTemplates,
  type BrandMeta,
  type ContentType,
  type TemplateMeta,
  type VoiceRegion,
} from '../api/engine'
import { cn } from '../lib/utils'

export interface WizardValues {
  prompt: string
  contentType: ContentType
  voiceRegion: VoiceRegion
  templateId: string
  brandId: string
}

interface GenerationWizardProps {
  values: WizardValues
  loading: boolean
  onChange: (patch: Partial<WizardValues>) => void
  onSubmit: () => void
}

const CONTENT_OPTIONS: { value: ContentType; label: string; hint: string }[] = [
  { value: 'video', label: 'Video', hint: 'MP4 kèm lời đọc' },
  { value: 'slide', label: 'Slide', hint: 'Bài thuyết trình HTML' },
  { value: 'poster', label: 'Poster', hint: 'Một khung hình HTML' },
]

export function GenerationWizard({
  values,
  loading,
  onChange,
  onSubmit,
}: GenerationWizardProps) {
  const promptId = useId()
  const typeId = useId()
  const templateId = useId()
  const brandId = useId()
  const voiceLegendId = useId()

  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [brands, setBrands] = useState<BrandMeta[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [assetsError, setAssetsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAssets() {
      setAssetsLoading(true)
      setAssetsError(null)
      try {
        const [tpl, br] = await Promise.all([fetchTemplates(), fetchBrands()])
        if (cancelled) return
        setTemplates(tpl)
        setBrands(br)

        // Seed defaults once lists arrive
        if (!values.templateId && tpl[0]) {
          onChange({ templateId: tpl[0].id })
        }
        if (!values.brandId && br[0]) {
          onChange({ brandId: br[0].id })
        }
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Không tải được mẫu / thương hiệu'
        setAssetsError(message)
      } finally {
        if (!cancelled) setAssetsLoading(false)
      }
    }

    void loadAssets()
    return () => {
      cancelled = true
    }
    // Intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <form
      className="flex h-full flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!loading) onSubmit()
      }}
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Tạo nội dung mới
        </h1>
        <p className="text-sm text-zinc-400">
          Chọn mẫu và thương hiệu, rồi mô tả yêu cầu. File xuất ra máy này;
          chỉ đưa lên Drive khi bạn bật trong Cài đặt.
        </p>
      </header>

      <div className="space-y-2">
        <label
          htmlFor={promptId}
          className="block text-sm font-medium text-zinc-200"
        >
          Mô tả yêu cầu <span className="text-blue-400">*</span>
        </label>
        <textarea
          id={promptId}
          required
          rows={6}
          disabled={loading}
          value={values.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          placeholder="Bạn muốn tạo nội dung gì hôm nay?"
          className={cn(
            'w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm leading-relaxed text-zinc-100',
            'placeholder:text-zinc-500',
            'transition-[border-color,box-shadow] duration-200',
            'hover:border-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={typeId}
          className="block text-sm font-medium text-zinc-200"
        >
          Loại nội dung
        </label>
        <select
          id={typeId}
          disabled={loading}
          value={values.contentType}
          onChange={(e) =>
            onChange({ contentType: e.target.value as ContentType })
          }
          className={selectClass}
        >
          {CONTENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} — {opt.hint}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={templateId}
          className="block text-sm font-medium text-zinc-200"
        >
          Chọn mẫu
        </label>
        {assetsLoading ? (
          <p className="text-xs text-zinc-500">Đang quét mẫu trên máy…</p>
        ) : (
          <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto studio-scrollbar sm:grid-cols-2">
            {templates.map((tpl) => {
              const selected = values.templateId === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={loading}
                  onClick={() => onChange({ templateId: tpl.id })}
                  className={cn(
                    'min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors duration-200',
                    selected
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  <span className="block text-sm font-medium text-zinc-100">
                    {tpl.name}
                  </span>
                  {tpl.description && (
                    <span className="mt-0.5 line-clamp-2 block text-[11px] text-zinc-500">
                      {tpl.description}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
        <select
          id={templateId}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          value={values.templateId}
          onChange={(e) => onChange({ templateId: e.target.value })}
        >
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={brandId}
          className="block text-sm font-medium text-zinc-200"
        >
          Chọn thương hiệu
        </label>
        <select
          id={brandId}
          disabled={loading || assetsLoading || brands.length === 0}
          value={values.brandId}
          onChange={(e) => onChange({ brandId: e.target.value })}
          className={selectClass}
        >
          {brands.length === 0 && (
            <option value="">Chưa có thương hiệu — chạy pnpm setup</option>
          )}
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
              {brand.description ? ` — ${brand.description}` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          Lấy từ bộ nhận diện local (open-design)
        </p>
      </div>

      {assetsError && (
        <p className="text-xs text-amber-400" role="status">
          Cảnh báo quét tài nguyên: {assetsError}. Đang dùng danh sách hiện có.
        </p>
      )}

      {values.contentType === 'video' && (
        <fieldset className="space-y-3" disabled={loading}>
          <legend
            id={voiceLegendId}
            className="text-sm font-medium text-zinc-200"
          >
            Giọng đọc
          </legend>
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-labelledby={voiceLegendId}
          >
            {(
              [
                {
                  value: 'north' as const,
                  title: 'Miền Bắc',
                  desc: 'Nam Minh · Hà Nội',
                },
                {
                  value: 'south' as const,
                  title: 'Miền Nam',
                  desc: 'Hoài My · Sài Gòn',
                },
              ] as const
            ).map((opt) => {
              const selected = values.voiceRegion === opt.value
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-200',
                    selected
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                  )}
                >
                  <input
                    type="radio"
                    name="voiceRegion"
                    value={opt.value}
                    checked={selected}
                    onChange={() => onChange({ voiceRegion: opt.value })}
                    className="mt-1 size-4 cursor-pointer accent-blue-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-100">
                      {opt.title}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {opt.desc}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-auto pt-2">
        <button
          type="submit"
          disabled={loading || !values.prompt.trim()}
          className={cn(
            'inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold',
            'bg-blue-600 text-white shadow-glow transition-[background-color,transform,opacity] duration-200',
            'hover:bg-blue-500 active:scale-[0.99]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tạo…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden />
              Tạo nội dung
            </>
          )}
        </button>
      </div>
    </form>
  )
}

const selectClass = cn(
  'min-h-11 w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100',
  'transition-colors duration-200 hover:border-zinc-600',
  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30',
  'disabled:cursor-not-allowed disabled:opacity-50'
)
