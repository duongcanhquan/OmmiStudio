import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Clapperboard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { isDriveUrl, resolveAssetUrl } from '../api/engine'
import { cn } from '../lib/utils'
import {
  selectionHasContent,
  useStudio,
  type RenderPhase,
} from './StudioContext'

const PHASE_STEPS: {
  id: Exclude<RenderPhase, 'idle' | 'done' | 'error'>
  label: string
}[] = [
  { id: 'script', label: 'AI đang viết kịch bản…' },
  { id: 'html', label: 'Đang tạo HTML…' },
  { id: 'motion', label: 'Đang áp hiệu ứng…' },
  { id: 'media', label: 'Đang render media…' },
]

function detectKind(url: string): 'video' | 'html' | 'drive' | 'unknown' {
  if (isDriveUrl(url) && /drive\.google\.com/i.test(url)) return 'drive'
  const lower = url.toLowerCase().split('?')[0] ?? url
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video'
  if (
    lower.endsWith('.html') ||
    lower.endsWith('.htm') ||
    lower.endsWith('.pdf')
  )
    return 'html'
  if (/^https?:\/\//i.test(url)) return 'drive'
  return 'unknown'
}

export function FinalExport() {
  const {
    selection,
    renderLoading,
    renderPhase,
    result,
    finalRender,
    error,
  } = useStudio()

  const primary = result.driveUrl || result.resultUrl
  const assetUrl = primary ? resolveAssetUrl(primary) : null
  const kind = assetUrl ? detectKind(assetUrl) : null
  const canRender =
    Boolean(selection.selectedTemplate) &&
    Boolean(selection.selectedBrand) &&
    selectionHasContent(selection)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          Xuất bản cuối cùng
        </h2>
        <p className="text-sm text-slate-400">
          Mẫu:{' '}
          <span className="text-slate-200">
            {selection.selectedTemplate?.name ?? 'chưa chọn'}
          </span>
          {' · '}
          Thương hiệu:{' '}
          <span className="text-slate-200">
            {selection.selectedBrand?.name ?? 'chưa chọn'}
          </span>
          {selection.selectedMotion
            ? ` · ${selection.selectedMotion.name}`
            : ''}
          .
        </p>
      </header>

      {result.previewUrl && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="border-b border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-500">
            Xem trước gần nhất
          </div>
          <iframe
            title="Final step preview"
            src={resolveAssetUrl(result.previewUrl)}
            sandbox="allow-scripts allow-same-origin"
            className="h-56 w-full border-0 bg-white sm:h-72"
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 backdrop-blur-md">
        <button
          type="button"
          disabled={renderLoading || !canRender}
          onClick={() => void finalRender()}
          className={cn(
            'group relative inline-flex min-h-14 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 text-base font-semibold text-slate-950 transition-transform',
            'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500',
            'shadow-[0_0_40px_rgba(34,211,238,0.35)]',
            'hover:scale-[1.02] active:scale-[0.99]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100'
          )}
        >
          <span
            className="pointer-events-none absolute inset-0 animate-pulse bg-white/10 opacity-40"
            aria-hidden
          />
          {renderLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Đang render…
            </>
          ) : (
            <>
              <Clapperboard className="size-5" aria-hidden />
              Render cuối (MP4 / HTML)
            </>
          )}
        </button>
        <p className="max-w-md text-center text-xs text-slate-500">
          {canRender
            ? 'Chạy pipeline đầy đủ. Video có TTS nếu cài edge-tts; slide/poster xuất HTML. Soft-fail về HTML nếu thiếu CLI tools. Tự động tải Drive nếu đã bật trong Cài đặt.'
            : 'Cần chọn mẫu + thương hiệu và điền brief/nội dung ở bước 3 trước khi render.'}
        </p>
      </div>

      {assetUrl && !renderLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 size-5 text-emerald-400"
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-emerald-100">
                Render hoàn tất
              </p>
              {result.message && (
                <p className="mt-1 text-xs text-slate-400">{result.message}</p>
              )}
            </div>
          </div>

          {kind === 'video' && (
            <video
              controls
              src={assetUrl}
              className="w-full rounded-xl border border-slate-800 bg-black"
            />
          )}

          {(kind === 'html' || kind === 'unknown') &&
            !/drive\.google\.com/i.test(assetUrl) && (
              <iframe
                title="Final output"
                src={assetUrl}
                sandbox="allow-scripts allow-same-origin"
                className="h-72 w-full rounded-xl border border-slate-800 bg-white"
              />
            )}

          <div className="flex flex-wrap gap-3">
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 hover:border-slate-500"
            >
              {result.uploadedToDrive || kind === 'drive' ? (
                <>
                  <ExternalLink className="size-4" aria-hidden />
                  Mở trên Google Drive
                </>
              ) : (
                <>
                  <Download className="size-4" aria-hidden />
                  Mở / tải xuống
                </>
              )}
            </a>
            {result.driveUrl &&
              result.resultUrl &&
              result.driveUrl !== result.resultUrl && (
                <a
                  href={resolveAssetUrl(result.resultUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm text-slate-300 hover:border-slate-500"
                >
                  <FileText className="size-4" aria-hidden />
                  Bản local
                </a>
              )}
          </div>
        </motion.div>
      )}

      {error && !renderLoading && (
        <p
          className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}

      <RenderOverlay open={renderLoading} phase={renderPhase} />
    </div>
  )
}

function RenderOverlay({
  open,
  phase,
}: {
  open: boolean
  phase: RenderPhase
}) {
  const activeIndex = PHASE_STEPS.findIndex((s) => s.id === phase)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-busy
          aria-label="Đang render"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-[0_0_60px_rgba(34,211,238,0.2)]"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40">
                <Sparkles className="size-5 animate-pulse" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">
                  OmniStudio đang render
                </p>
                <p className="text-xs text-slate-400">
                  Vui lòng giữ tab này mở…
                </p>
              </div>
            </div>

            <ol className="space-y-3">
              {PHASE_STEPS.map((step, index) => {
                const done = activeIndex > index
                const current =
                  activeIndex === index || (activeIndex < 0 && index === 0)
                return (
                  <li
                    key={step.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                      current
                        ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100'
                        : done
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200/90'
                          : 'border-slate-800 text-slate-500'
                    )}
                  >
                    {current ? (
                      <Loader2
                        className="size-4 shrink-0 animate-spin"
                        aria-hidden
                      />
                    ) : done ? (
                      <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                    ) : (
                      <span className="size-4 shrink-0 rounded-full border border-slate-700" />
                    )}
                    {step.label}
                  </li>
                )
              })}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
