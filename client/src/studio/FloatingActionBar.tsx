import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { useStudio, type StudioStep } from './StudioContext'

const STEPS: { id: StudioStep; label: string }[] = [
  { id: 1, label: 'Mẫu' },
  { id: 2, label: 'Thương hiệu' },
  { id: 3, label: 'Nội dung' },
  { id: 4, label: 'Xuất bản' },
]

export function FloatingActionBar() {
  const {
    step,
    setStep,
    goBack,
    goNext,
    canGoNext,
    renderLoading,
    previewLoading,
  } = useStudio()

  const busy = renderLoading || previewLoading

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-3 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:gap-4 sm:px-4">
        <button
          type="button"
          disabled={step === 1 || busy}
          onClick={goBack}
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-slate-200',
            'hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Quay lại
        </button>

        <div className="hidden flex-1 items-center justify-center gap-1.5 sm:flex">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => setStep(s.id)}
              className={cn(
                'min-h-9 cursor-pointer rounded-lg px-2.5 text-xs font-medium transition-colors',
                step === s.id
                  ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/40'
                  : s.id < step
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-900'
              )}
            >
              {s.id}. {s.label}
            </button>
          ))}
        </div>

        <p className="flex-1 text-center text-xs text-slate-500 sm:hidden">
          Bước {step} / 4
        </p>

        <button
          type="button"
          disabled={step === 4 || !canGoNext || busy}
          onClick={goNext}
          className={cn(
            'ml-auto inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950',
            'hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40'
          )}
        >
          Tiếp theo
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
