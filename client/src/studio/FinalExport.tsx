import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Clapperboard,
  Cloud,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { isDriveUrl, resolveAssetUrl, type PublishTarget } from '../api/engine'
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
  { id: 'script', label: 'Đang biên soạn / xử lý kịch bản…' },
  { id: 'html', label: 'Đang dựng HTML theo mẫu…' },
  { id: 'motion', label: 'Đang gắn hiệu ứng chuyển động…' },
  { id: 'media', label: 'Đang render media / TTS…' },
  { id: 'publish', label: 'Đang đóng gói & xuất bản…' },
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

function downloadFileName(url: string): string {
  try {
    const pathOnly = url.split('?')[0] ?? url
    const base = pathOnly.split('/').pop()
    return base && base.includes('.') ? base : 'omnistudio-output.html'
  } catch {
    return 'omnistudio-output.html'
  }
}

export function FinalExport() {
  const {
    selection,
    renderLoading,
    renderPhase,
    result,
    finalRender,
    error,
    publishTarget,
    setPublishTarget,
    driveReady,
  } = useStudio()

  const localUrl = result.resultUrl
    ? resolveAssetUrl(result.resultUrl)
    : null
  const driveUrl = result.driveUrl
    ? resolveAssetUrl(result.driveUrl)
    : result.uploadedToDrive && localUrl
      ? localUrl
      : null
  const primary = result.uploadedToDrive
    ? driveUrl || localUrl
    : localUrl || driveUrl
  const kind = primary ? detectKind(primary) : null
  const canRender =
    Boolean(selection.selectedTemplate) &&
    Boolean(selection.selectedBrand) &&
    selectionHasContent(selection)

  function pickTarget(target: PublishTarget) {
    if (target === 'drive' && !driveReady) return
    setPublishTarget(target)
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          Chạy & xuất bản
        </h2>
        <p className="text-sm text-slate-400">
          Luồng đã thống nhất: mẫu → thương hiệu → kịch bản → chọn nơi xuất →
          chạy. Trong lúc chờ sẽ có thông báo tiến trình.
        </p>
      </header>

      <ul className="grid gap-2 sm:grid-cols-3">
        <CheckItem
          ok={Boolean(selection.selectedTemplate)}
          label="1. Mẫu"
          detail={selection.selectedTemplate?.name ?? 'Chưa chọn'}
        />
        <CheckItem
          ok={Boolean(selection.selectedBrand)}
          label="2. Thương hiệu"
          detail={selection.selectedBrand?.name ?? 'Chưa chọn'}
        />
        <CheckItem
          ok={selectionHasContent(selection)}
          label="3. Kịch bản"
          detail={
            selectionHasContent(selection)
              ? 'Đã có nội dung'
              : 'Thiếu — quay lại bước 3'
          }
        />
      </ul>

      {/* Destination */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          4. Xuất ra đâu?
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <DestinationCard
            active={publishTarget === 'local'}
            onClick={() => pickTarget('local')}
            icon={HardDrive}
            title="Máy này / Desktop"
            hint="Giữ file trên server local — tải về máy bạn sau khi xong."
          />
          <DestinationCard
            active={publishTarget === 'drive'}
            disabled={!driveReady}
            onClick={() => pickTarget('drive')}
            icon={Cloud}
            title="Google Drive"
            hint={
              driveReady
                ? 'Upload vào thư mục Drive đã cấu hình trong Cài đặt.'
                : 'Chưa sẵn sàng — vào Cài đặt → Lưu trữ đám mây để bật Drive.'
            }
          />
        </div>
      </section>

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

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8">
        <button
          type="button"
          disabled={
            renderLoading ||
            !canRender ||
            (publishTarget === 'drive' && !driveReady)
          }
          onClick={() => void finalRender(publishTarget)}
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
              Đang xuất bản… vui lòng chờ
            </>
          ) : (
            <>
              <Clapperboard className="size-5" aria-hidden />
              {publishTarget === 'drive'
                ? 'Chạy & xuất lên Drive'
                : 'Chạy & xuất ra máy này'}
            </>
          )}
        </button>
        <p className="max-w-lg text-center text-xs text-slate-500">
          {canRender
            ? publishTarget === 'drive'
              ? 'Sẽ upload lên Google Drive sau khi render. Giữ tab mở đến khi có thông báo hoàn tất.'
              : 'File lưu local — sau khi xong bấm Tải về để đưa vào Downloads/Desktop. Giữ tab mở trong lúc chờ.'
            : 'Hoàn tất bước 1–3 trước khi xuất bản.'}
        </p>
      </div>

      {primary && !renderLoading && (
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
                {result.uploadedToDrive
                  ? 'Đã xuất lên Google Drive'
                  : 'Đã xuất ra máy (local)'}
              </p>
              {result.message && (
                <p className="mt-1 text-xs text-slate-400">{result.message}</p>
              )}
            </div>
          </div>

          {kind === 'video' && localUrl && !result.uploadedToDrive && (
            <video
              controls
              src={localUrl}
              className="w-full rounded-xl border border-slate-800 bg-black"
            />
          )}

          {(kind === 'html' || kind === 'unknown') &&
            localUrl &&
            !/drive\.google\.com/i.test(localUrl) && (
              <iframe
                title="Final output"
                src={localUrl}
                sandbox="allow-scripts allow-same-origin"
                className="h-72 w-full rounded-xl border border-slate-800 bg-white"
              />
            )}

          <div className="flex flex-wrap gap-3">
            {!result.uploadedToDrive && localUrl && (
              <a
                href={localUrl}
                download={downloadFileName(localUrl)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <Download className="size-4" aria-hidden />
                Tải về máy / Desktop
              </a>
            )}
            {(result.uploadedToDrive || driveUrl) && (
              <a
                href={driveUrl || primary}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-100 hover:border-slate-500"
              >
                <ExternalLink className="size-4" aria-hidden />
                Mở trên Google Drive
              </a>
            )}
            {localUrl && result.uploadedToDrive && (
              <a
                href={localUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm text-slate-300 hover:border-slate-500"
              >
                <FileText className="size-4" aria-hidden />
                Bản local (nếu còn)
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

      <RenderOverlay
        open={renderLoading}
        phase={renderPhase}
        publishTarget={publishTarget}
      />
    </div>
  )
}

function DestinationCard({
  active,
  disabled,
  onClick,
  icon: Icon,
  title,
  hint,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  icon: typeof HardDrive
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-[5.5rem] cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-colors',
        active
          ? 'border-cyan-500/40 bg-cyan-500/10 ring-1 ring-cyan-400/30'
          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600',
        disabled && 'cursor-not-allowed opacity-50 hover:border-slate-800'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1',
          active
            ? 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30'
            : 'bg-slate-900 text-slate-400 ring-slate-700'
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-50">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-400">
          {hint}
        </span>
      </span>
    </button>
  )
}

function RenderOverlay({
  open,
  phase,
  publishTarget,
}: {
  open: boolean
  phase: RenderPhase
  publishTarget: PublishTarget
}) {
  const [elapsed, setElapsed] = useState(0)
  const activeIndex = PHASE_STEPS.findIndex((s) => s.id === phase)

  useEffect(() => {
    if (!open) {
      setElapsed(0)
      return
    }
    const started = Date.now()
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, 500)
    return () => window.clearInterval(id)
  }, [open])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeLabel = mins > 0 ? `${mins}p ${secs}s` : `${secs}s`

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-busy
          aria-label="Đang xuất bản — vui lòng chờ"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900/95 p-6 shadow-[0_0_60px_rgba(34,211,238,0.2)]"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40">
                <Sparkles className="size-5 animate-pulse" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-50">
                  Đang xuất bản — vui lòng chờ
                </p>
                <p className="text-xs text-slate-400">
                  Đích:{' '}
                  {publishTarget === 'drive'
                    ? 'Google Drive'
                    : 'Máy này (tải về sau)'}{' '}
                  · Đã chờ {timeLabel}
                </p>
              </div>
            </div>

            <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
              Giữ tab này mở. Render có thể mất vài phút (TTS / video). Không
              đóng cửa sổ cho đến khi hoàn tất.
            </p>

            <ol className="space-y-2.5">
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

function CheckItem({
  ok,
  label,
  detail,
}: {
  ok: boolean
  label: string
  detail: string
}) {
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3',
        ok
          ? 'border-emerald-500/25 bg-emerald-500/5'
          : 'border-amber-500/25 bg-amber-500/5'
      )}
    >
      <CheckCircle2
        className={cn(
          'mt-0.5 size-4 shrink-0',
          ok ? 'text-emerald-400' : 'text-amber-400/80'
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-100">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-400">
          {detail}
        </span>
      </span>
    </li>
  )
}
