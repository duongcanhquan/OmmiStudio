import { useCallback, useEffect, useState } from 'react'
import { Sidebar, type NavId } from './components/Sidebar'
import { BrandAssetsPage } from './pages/BrandAssets'
import { ProjectsPage } from './pages/Projects'
import { SettingsPage } from './pages/Settings'
import { StudioPage } from './pages/Studio'
import type { StudioStep } from './studio/StudioContext'
import { cn } from './lib/utils'

export default function App() {
  const [nav, setNav] = useState<NavId>('create')
  const [jumpStep, setJumpStep] = useState<StudioStep | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [toastIsError, setToastIsError] = useState(false)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(id)
  }, [toast])

  const onJumpConsumed = useCallback(() => setJumpStep(null), [])

  const notify = useCallback((message: string, isError?: boolean) => {
    setToast(message)
    setToastIsError(Boolean(isError))
  }, [])

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-slate-950 text-slate-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-600 focus:px-3 focus:py-2 focus:text-sm"
      >
        Chuyển tới nội dung chính
      </a>

      <Sidebar active={nav} onNavigate={setNav} />

      <main
        id="main"
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        {nav === 'create' && (
          <StudioPage
            jumpStep={jumpStep}
            onJumpConsumed={onJumpConsumed}
            onNotify={notify}
          />
        )}
        {nav === 'projects' && (
          <ProjectsPage
            onNotify={notify}
            onCreateNew={() => {
              setNav('create')
              setJumpStep(1)
            }}
          />
        )}
        {nav === 'assets' && (
          <BrandAssetsPage
            onNotify={notify}
            onUseInStudio={(brandId) => {
              if (brandId) {
                try {
                  sessionStorage.setItem('omnistudio.pendingBrandId', brandId)
                } catch {
                  /* ignore */
                }
              }
              setNav('create')
              setJumpStep(2)
            }}
          />
        )}
        {nav === 'settings' && <SettingsPage onNotify={notify} />}
      </main>

      {toast && (
        <div
          role={toastIsError ? 'alert' : 'status'}
          aria-live={toastIsError ? 'assertive' : 'polite'}
          className={cn(
            'fixed bottom-6 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg',
            toastIsError
              ? 'border-red-500/40 bg-red-950 text-red-100'
              : 'border-slate-700 bg-slate-900 text-slate-100'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{toast}</p>
          <button
            type="button"
            className="mt-2 cursor-pointer text-xs underline opacity-80 hover:opacity-100"
            onClick={() => setToast(null)}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  )
}
