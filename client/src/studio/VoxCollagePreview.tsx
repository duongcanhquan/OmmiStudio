import type { StudioBrand } from '../lib/brands'
import {
  compositionForKind,
  themeForKind,
  type VoxLayoutKind,
} from '../lib/voxThemes'
import { cn } from '../lib/utils'
import { PREVIEW_SAMPLE } from './LookPreview'

export function VoxCollagePreview({
  kind,
  brand,
  large,
}: {
  kind: VoxLayoutKind
  brand: StudioBrand
  large?: boolean
}) {
  const theme = themeForKind(kind)
  const composition = compositionForKind(kind)
  const sample = PREVIEW_SAMPLE[brand.industry] ?? PREVIEW_SAMPLE.general
  const dark =
    theme.bg === '#111111' ||
    theme.bg === '#1c1914' ||
    theme.bg === '#0f3d4c' ||
    theme.bg === '#2f4a3c'
  const fg = dark ? theme.paper : theme.ink
  const pad = large ? 'p-5' : 'p-3'
  const h1 = large ? 'text-[28px]' : 'text-[13px]'
  const tiny = large ? 'text-[11px]' : 'text-[7px]'

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: theme.bg,
        color: fg,
        fontFamily: theme.display,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
        style={{
          backgroundImage: `radial-gradient(${theme.ink}55 0.7px, transparent 0.9px)`,
          backgroundSize: '4px 4px',
        }}
      />
      <span
        className="absolute left-2 top-3 h-6 w-8 -rotate-12 shadow-sm"
        style={{ background: theme.accent }}
      />
      <span
        className="absolute right-3 top-6 h-7 w-6 rotate-[16deg] shadow-sm"
        style={{ background: theme.secondary }}
      />
      <span
        className="absolute bottom-8 left-4 h-2.5 w-10 -rotate-6"
        style={{ background: '#e8d9a8cc' }}
      />

      {composition === 'diagonal' && (
        <div
          className="absolute left-[-12%] top-[22%] h-[28%] w-[130%] -rotate-12"
          style={{ background: theme.accent }}
        />
      )}

      <div className={cn('relative z-10 flex h-full flex-col justify-center', pad)}>
        {composition === 'columns' && (
          <div
            className={cn('mb-1 flex justify-between font-black uppercase tracking-widest', tiny)}
            style={{ borderBottom: `2px solid ${fg}`, color: fg }}
          >
            <span>THE BRIEF</span>
            <span>VOL. 01</span>
          </div>
        )}

        {composition === 'stat' ? (
          <>
            <p
              className={cn('font-black leading-none', large ? 'text-6xl' : 'text-4xl')}
              style={{ color: theme.accent }}
            >
              3
            </p>
            <p className={cn('mt-1 font-black uppercase leading-[0.9]', h1)}>{sample.headline}</p>
          </>
        ) : composition === 'list' ? (
          <>
            <p className={cn('font-black uppercase leading-[0.9]', h1)}>{sample.headline}</p>
            <ol className={cn('mt-2 space-y-1', tiny)} style={{ color: theme.ink }}>
              {['01', '02', '03'].map((n) => (
                <li
                  key={n}
                  className="flex gap-1.5 px-1.5 py-1"
                  style={{ background: theme.paper }}
                >
                  <b style={{ color: theme.accent }}>{n}</b>
                  <span>{sample.line}</span>
                </li>
              ))}
            </ol>
          </>
        ) : composition === 'timeline' ? (
          <>
            <p className={cn('font-black uppercase leading-[0.9]', h1)}>{sample.headline}</p>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {['01', '02', '03', '04'].map((n) => (
                <div key={n} className="px-1 py-1" style={{ background: theme.paper, color: theme.ink }}>
                  <p className="font-black" style={{ color: theme.accent, fontSize: large ? 11 : 7 }}>
                    {n}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : composition === 'grid' ? (
          <>
            <p className={cn('uppercase tracking-[0.2em] opacity-70', tiny)}>{theme.era}</p>
            <p className={cn('mt-1 max-w-[16ch] font-black uppercase leading-[0.88]', h1)}>
              {sample.headline}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {['01', '02', '03'].map((n) => (
                <div key={n} style={{ borderTop: `2px solid ${theme.accent}` }}>
                  <p className="font-black" style={{ color: theme.accent, fontSize: large ? 12 : 8 }}>
                    {n}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : composition === 'seal' ? (
          <>
            <div
              className="absolute right-4 top-5 grid size-10 place-items-center rounded-sm border-2 font-black"
              style={{ borderColor: theme.accent, color: theme.accent, background: theme.paper }}
            >
              印
            </div>
            <div className={pad} style={{ background: theme.paper, color: theme.ink, maxWidth: '90%' }}>
              <p className={cn('font-black leading-[0.9]', h1)}>{sample.headline}</p>
            </div>
          </>
        ) : (
          <div
            className={cn('max-w-[92%]', large ? 'p-4' : 'p-2')}
            style={{ background: theme.paper, color: theme.ink }}
          >
            <p className={cn('uppercase tracking-[0.18em] opacity-60', tiny)}>{theme.era}</p>
            <p className={cn('mt-1 font-black uppercase leading-[0.88]', h1)}>{sample.headline}</p>
            {large && (
              <p className="mt-2 opacity-70" style={{ fontFamily: theme.body, fontSize: 12 }}>
                {sample.line}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
