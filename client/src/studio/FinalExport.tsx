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
import { useEffect, useRef, useState } from 'react'
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
  { id: 'script', label: 'Đang chia cảnh chữ tiếng Việt…' },
  { id: 'html', label: 'Đang áp màu thương hiệu…' },
  { id: 'motion', label: 'Đang gắn chuyển động chữ…' },
  { id: 'media', label: 'Đang mix nhạc nền và render MP4…' },
  { id: 'publish', label: 'Đang đóng gói file hoàn chỉnh…' },
]

function detectKind(
  url: string
): 'video' | 'html' | 'pdf' | 'image' | 'zip' | 'drive' | 'unknown' {
  if (isDriveUrl(url) && /drive\.google\.com/i.test(url)) return 'drive'
  const lower = url.toLowerCase().split('?')[0] ?? url
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video'
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
    return 'image'
  if (lower.endsWith('.zip')) return 'zip'
  if (lower.endsWith('.html') || lower.endsWith('.htm'))
    return 'html'
  if (/^https?:\/\//i.test(url)) return 'drive'
  return 'unknown'
}

function downloadFileName(url: string, title?: string): string {
  const ext = (url.split('?')[0]?.split('.').pop() || 'html').toLowerCase()
  const safe = (title || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .slice(0, 60)
  return `${safe || 'lyon-studio-ket-qua'}.${ext}`
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

  const autoStarted = useRef(false)
  const autoDownloaded = useRef(false)

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

  const fileTitle =
    selection.fieldValues.title ||
    selection.selectedTemplate?.name ||
    'lyon-studio-ket-qua'
  const fileName = localUrl ? downloadFileName(localUrl, fileTitle) : ''

  const [downloadBusy, setDownloadBusy] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function handleDownload() {
    if (!localUrl) return
    setDownloadBusy(true)
    setDownloadError(null)
    try {
      const res = await fetch(localUrl)
      if (!res.ok) {
        throw new Error(`Không lấy được file (${res.status}).`)
      }
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = fileName || 'lyon-studio-ket-qua'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(href), 2_000)
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Không tải được file.'
      )
    } finally {
      setDownloadBusy(false)
    }
  }

  useEffect(() => {
    if (renderLoading) autoDownloaded.current = false
  }, [renderLoading])

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          {renderLoading
            ? 'Đang xử lý kịch bản…'
            : primary
              ? result.degraded
                ? 'Đã xuất bản xem trước — chưa phải file hoàn chỉnh'
                : 'File hoàn chỉnh đã sẵn sàng'
              : canRender
                ? 'Chọn nơi lưu rồi bấm Xuất file'
                : 'Chưa đủ kịch bản để xuất'}
        </h2>
        <p className="text-sm text-slate-400">
          {renderLoading
            ? 'Giữ tab này mở. Khi xong, bấm Tải về — hệ thống không tự tải.'
            : primary
              ? kind === 'video'
                ? 'MP4 quay từ trang html-video (màu, chữ chạy, motion). Bấm Tải về khi sẵn sàng.'
                : kind === 'image'
                  ? 'Ảnh PNG bài đăng — kéo vào Instagram / Facebook / Zalo. Bấm Tải về khi sẵn sàng.'
                  : kind === 'zip'
                    ? 'Gói nhiều ảnh PNG (carousel). Giải nén rồi đăng từng khung.'
                    : kind === 'pdf'
                      ? 'PDF in được từ form. Bấm Tải về khi sẵn sàng.'
                      : 'HTML theo thương hiệu. Bấm Tải về khi sẵn sàng.'
              : canRender
                ? 'Form đã đủ. Chọn tải về máy hoặc Drive, rồi bấm Xuất file — hệ thống không tự chạy.'
                : 'Quay lại bước 4, điền từng phần rồi bấm Chạy.'}
        </p>
      </header>

      {!renderLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPublishTarget('local')}
            className={cn(
              'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
              publishTarget === 'local'
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-50'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
            )}
          >
            <span className="block font-semibold">Tải về máy này</span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Giữ file trên máy để mở / gửi ngay.
            </span>
          </button>
          <button
            type="button"
            disabled={!driveReady}
            onClick={() => setPublishTarget('drive')}
            className={cn(
              'rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              publishTarget === 'drive'
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-50'
                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
            )}
          >
            <span className="block font-semibold">Google Drive</span>
            <span className="mt-0.5 block text-xs text-slate-400">
              {driveReady
                ? 'Tải lên Drive sau khi dựng xong. Bản máy vẫn giữ lại.'
                : 'Chưa cấu hình Drive trong Cài đặt.'}
            </span>
          </button>
        </div>
      )}

      {!primary && !renderLoading && (
        <button
          type="button"
          disabled={!canRender || (publishTarget === 'drive' && !driveReady)}
          onClick={() => {
            autoStarted.current = true
            void finalRender(publishTarget)
          }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Clapperboard className="size-4" aria-hidden />
          Xuất file hoàn chỉnh
        </button>
      )}

      {result.degraded && primary && !renderLoading && (
        <p
          className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          Đây là bản HTML (xem được trên trình duyệt). Máy này trước đó chưa
          thấy Chrome/FFmpeg đúng đường dẫn — hãy xuất lại để lấy MP4 hoặc
          PDF. Nút Tải vẫn lưu được file HTML.
        </p>
      )}

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
                  ? 'File hoàn chỉnh đã lên Google Drive'
                  : 'File hoàn chỉnh đã sẵn sàng'}
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

          {kind === 'image' && localUrl && !result.uploadedToDrive && (
            <img
              src={localUrl}
              alt="Ảnh bài đăng đã xuất"
              className="mx-auto max-h-[28rem] w-auto max-w-full rounded-xl border border-slate-800 bg-slate-950"
            />
          )}

          {kind === 'pdf' && localUrl && !result.uploadedToDrive && (
            <iframe
              title="Kết quả PDF"
              src={localUrl}
              className="h-80 w-full rounded-xl border border-slate-800 bg-white"
            />
          )}

          {(kind === 'html' || kind === 'unknown') &&
            localUrl &&
            !/drive\.google\.com/i.test(localUrl) && (
              <iframe
                title="Kết quả xuất"
                src={localUrl}
                sandbox="allow-scripts allow-same-origin"
                className="h-72 w-full rounded-xl border border-slate-800 bg-white"
              />
            )}

          <div className="flex flex-wrap gap-3">
            {!result.uploadedToDrive && localUrl && (
              <button
                type="button"
                disabled={downloadBusy}
                onClick={() => void handleDownload()}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {downloadBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-4" aria-hidden />
                )}
                Tải file hoàn chỉnh
              </button>
            )}
            {downloadError && (
              <p className="w-full text-xs text-rose-300" role="alert">
                {downloadError}
              </p>
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
                Bản trên máy (nếu còn)
              </a>
            )}
          </div>
        </motion.div>
      )}

      {error && !renderLoading && (
        <div className="space-y-3">
          <p
            className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              autoStarted.current = false
              void finalRender(publishTarget)
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            <Clapperboard className="size-4" aria-hidden />
            Thử xuất lại
          </button>
        </div>
      )}

      <RenderOverlay
        open={renderLoading}
        phase={renderPhase}
        publishTarget={publishTarget}
        imageMode={
          selection.selectedTemplate?.type === 'social' &&
          selection.fieldValues.outputFormat !== 'video'
        }
      />
    </div>
  )
}

function RenderOverlay({
  open,
  phase,
  publishTarget,
  imageMode,
}: {
  open: boolean
  phase: RenderPhase
  publishTarget: PublishTarget
  imageMode: boolean
}) {
  const steps = imageMode
    ? [
        { id: 'script' as const, label: 'Đang lấy chữ từng khung…' },
        { id: 'html' as const, label: 'Đang áp màu thương hiệu…' },
        { id: 'motion' as const, label: 'Đang xếp bố cục ảnh…' },
        { id: 'media' as const, label: 'Đang xuất file PNG…' },
        { id: 'publish' as const, label: 'Đang đóng gói ảnh…' },
      ]
    : PHASE_STEPS
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
          aria-label="Đang xử lý — vui lòng chờ"
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
                  Đang xử lý — vui lòng chờ
                </p>
                <p className="text-xs text-slate-400">
                  Đích:{' '}
                  {publishTarget === 'drive'
                    ? 'Google Drive'
                    : 'Tự tải về máy khi xong'}{' '}
                  · Đã chờ {timeLabel}
                </p>
              </div>
            </div>

            <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
              Hệ thống đang dựng file từ kịch bản của bạn. Giữ tab mở đến khi
              thấy nút tải về.
            </p>

            <ol className="space-y-2.5">
              {steps.map((step, index) => {
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
