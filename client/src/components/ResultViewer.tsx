import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  ExternalLink,
  FileText,
  Loader2,
  Mic,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isDriveUrl, resolveAssetUrl } from '../api/engine'

export type PipelinePhase =
  | 'idle'
  | 'script'
  | 'voice'
  | 'render'
  | 'done'
  | 'error'

interface ResultViewerProps {
  loading: boolean
  phase: PipelinePhase
  resultUrl: string | null
  driveUrl?: string | null
  uploadedToDrive?: boolean
  error: string | null
  successMessage?: string | null
}

const PHASE_COPY: Record<
  Exclude<PipelinePhase, 'idle' | 'done' | 'error'>,
  { label: string; detail: string; icon: typeof Sparkles }
> = {
  script: {
    label: 'AI is writing script',
    detail: 'Gemini is structuring scenes, motion, and voiceover copy…',
    icon: Wand2,
  },
  voice: {
    label: 'Recording voice',
    detail: 'Edge-TTS is generating Vietnamese neural voiceovers…',
    icon: Mic,
  },
  render: {
    label: 'Rendering + upload',
    detail: 'nexu-io render → Google Drive publish…',
    icon: Clapperboard,
  },
}

function detectKind(url: string): 'video' | 'html' | 'pdf' | 'drive' | 'unknown' {
  if (isDriveUrl(url) && /drive\.google\.com/i.test(url)) return 'drive'
  const lower = url.toLowerCase().split('?')[0]
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video'
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html'
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/^https?:\/\//i.test(url)) return 'drive'
  return 'unknown'
}

export function ResultViewer({
  loading,
  phase,
  resultUrl,
  driveUrl,
  uploadedToDrive,
  error,
  successMessage,
}: ResultViewerProps) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!loading) return
    setTick(0)
    const id = window.setInterval(() => setTick((t) => t + 1), 4000)
    return () => window.clearInterval(id)
  }, [loading])

  const effectivePhase: PipelinePhase = useMemo(() => {
    if (error) return 'error'
    if (!loading && resultUrl) return 'done'
    if (!loading) return phase === 'idle' ? 'idle' : phase
    if (phase !== 'idle' && phase !== 'done') return phase
    if (tick < 1) return 'script'
    if (tick < 2) return 'voice'
    return 'render'
  }, [error, loading, phase, resultUrl, tick])

  const primaryUrl = driveUrl || resultUrl
  const assetUrl = primaryUrl ? resolveAssetUrl(primaryUrl) : null
  const kind = assetUrl ? detectKind(assetUrl) : null

  return (
    <section
      className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80"
      aria-live="polite"
      aria-busy={loading}
    >
      <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Preview</h2>
          <p className="text-xs text-zinc-500">
            {uploadedToDrive ? 'Published to Google Drive' : 'Local / Drive output'}
          </p>
        </div>
        {assetUrl && (
          <a
            href={assetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Open <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </header>

      <div className="studio-scrollbar relative flex min-h-0 flex-1 flex-col overflow-auto p-5">
        {effectivePhase === 'idle' && !resultUrl && !error && <EmptyState />}

        {loading && (
          <LoadingState
            phase={effectivePhase === 'done' ? 'render' : effectivePhase}
          />
        )}

        {error && !loading && (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5"
          >
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="size-5 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">Generation failed</p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-red-200/90">
              {error}
            </p>
          </div>
        )}

        {!loading && assetUrl && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">
                {uploadedToDrive
                  ? 'Uploaded to Google Drive'
                  : 'Generation complete'}
              </p>
            </div>
            {successMessage && (
              <p className="text-xs leading-relaxed text-emerald-100/80">
                {successMessage}
              </p>
            )}
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full cursor-pointer items-center gap-2 truncate text-sm font-medium text-blue-300 underline-offset-2 hover:text-blue-200 hover:underline"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{assetUrl}</span>
            </a>
          </div>
        )}

        {!loading && assetUrl && kind === 'video' && (
          <video
            key={assetUrl}
            controls
            className="aspect-video w-full rounded-xl bg-black object-contain ring-1 ring-zinc-800"
            src={assetUrl}
          >
            <track kind="captions" />
          </video>
        )}

        {!loading && assetUrl && (kind === 'html' || kind === 'pdf') && (
          <iframe
            key={assetUrl}
            title="Generated content preview"
            src={assetUrl}
            className="min-h-[480px] w-full flex-1 rounded-xl bg-white ring-1 ring-zinc-800"
          />
        )}

        {!loading && assetUrl && kind === 'drive' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
            <FileText className="size-10 text-zinc-400" aria-hidden />
            <p className="max-w-sm text-sm text-zinc-300">
              Your file is on Google Drive. Use the link above to view or share
              it. Embedded Drive preview may require Google sign-in.
            </p>
            <a
              href={assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Open in Google Drive
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
        )}

        {!loading && assetUrl && kind === 'unknown' && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <FileText className="size-5 text-zinc-400" aria-hidden />
            <p className="text-sm text-zinc-300">
              Preview unavailable for this file type.
            </p>
            <a
              href={assetUrl}
              className="cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Download / open result
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 ring-1 ring-zinc-800">
        <Sparkles className="size-6 text-zinc-500" aria-hidden />
      </div>
      <p className="text-sm font-medium text-zinc-300">No output yet</p>
      <p className="max-w-xs text-xs leading-relaxed text-zinc-500">
        Choose a template and brand, then generate. Results appear here — and on
        Drive when credentials are set.
      </p>
    </div>
  )
}

function LoadingState({ phase }: { phase: PipelinePhase }) {
  const meta =
    phase === 'script' || phase === 'voice' || phase === 'render'
      ? PHASE_COPY[phase]
      : PHASE_COPY.render
  const Icon = meta.icon

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="space-y-3">
        <div className="h-4 w-2/5 animate-pulse rounded bg-zinc-800" />
        <div className="aspect-video w-full animate-pulse rounded-xl bg-zinc-900 ring-1 ring-zinc-800" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-800" />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <Loader2
          className="mt-0.5 size-4 shrink-0 animate-spin text-blue-400"
          aria-hidden
        />
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
            <Icon className="size-3.5 text-blue-400" aria-hidden />
            Crafting your content…
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {meta.label} → next stages queue automatically
          </p>
          <p className="mt-1 text-xs text-zinc-500">{meta.detail}</p>
        </div>
      </div>
    </div>
  )
}
