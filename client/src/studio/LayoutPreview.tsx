import type { StudioBrand } from '../lib/brands'
import type { LayoutKind, StudioLayout } from '../lib/layoutCatalog'
import type { PreviewFrame } from '../lib/templateCatalog'
import { isVoxLayoutKind } from '../lib/voxThemes'
import { cn } from '../lib/utils'
import { PREVIEW_SAMPLE } from './LookPreview'
import { VoxCollagePreview } from './VoxCollagePreview'

const FRAME_CLASS: Record<PreviewFrame, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-video',
  stack: 'aspect-[5/4]',
  sheet: 'aspect-[3/4]',
  slides: 'aspect-video',
}

function mix(hex: string, into: string, amount: number): string {
  const a = parseInt(hex.slice(1), 16)
  const b = parseInt(into.slice(1), 16)
  const ch = (shift: number) => {
    const av = (a >> shift) & 255
    const bv = (b >> shift) & 255
    return Math.round(av + (bv - av) * amount)
  }
  const r = ch(16)
  const g = ch(8)
  const bl = ch(0)
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

function Headline({
  text,
  accentWord,
  accent,
  className,
}: {
  text: string
  accentWord?: string
  accent: string
  className?: string
}) {
  if (!accentWord || !text.toLowerCase().includes(accentWord.toLowerCase())) {
    return <p className={className}>{text}</p>
  }
  const idx = text.toLowerCase().indexOf(accentWord.toLowerCase())
  return (
    <p className={className}>
      {text.slice(0, idx)}
      <span style={{ color: accent }}>{text.slice(idx, idx + accentWord.length)}</span>
      {text.slice(idx + accentWord.length)}
    </p>
  )
}

export function LayoutPreview({
  layout,
  brand,
  large,
}: {
  layout: StudioLayout
  brand: StudioBrand
  large?: boolean
}) {
  const sample = PREVIEW_SAMPLE[brand.industry] ?? PREVIEW_SAMPLE.general
  const p = brand.palette
  const cream = mix(p.background, '#fff7ed', 0.72)
  const paper = mix(p.background, '#ffffff', 0.88)
  const ink = mix(p.text, '#1c1917', 0.35)

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        FRAME_CLASS[layout.frame],
        large ? 'rounded-2xl shadow-2xl' : 'rounded-lg'
      )}
      style={{
        color: p.text,
        fontFamily: `${brand.typography.heading}, Be Vietnam Pro, system-ui, sans-serif`,
      }}
      aria-hidden
    >
      <KindArt
        kind={layout.kind}
        brand={brand}
        sample={sample}
        accentWord={layout.accentWord}
        cream={cream}
        paper={paper}
        ink={ink}
        large={large}
      />
    </div>
  )
}

function KindArt({
  kind,
  brand,
  sample,
  accentWord,
  cream,
  paper,
  ink,
  large,
}: {
  kind: LayoutKind
  brand: StudioBrand
  sample: (typeof PREVIEW_SAMPLE)['education']
  accentWord?: string
  cream: string
  paper: string
  ink: string
  large?: boolean
}) {
  const p = brand.palette
  const pad = large ? 'p-5' : 'p-3'
  const h1 = large ? 'text-3xl' : 'text-[17px]'
  const tiny = large ? 'text-[11px]' : 'text-[8px]'

  if (isVoxLayoutKind(kind)) {
    return <VoxCollagePreview kind={kind} brand={brand} large={large} />
  }

  switch (kind) {
    case 'pastel-hero':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: cream, color: ink }}>
          <span
            className="w-fit rounded-full px-2 py-0.5 font-bold uppercase tracking-wider"
            style={{ background: p.accent, color: p.background, fontSize: large ? 11 : 8 }}
          >
            {sample.kicker}
          </span>
          <Headline
            text={sample.headline}
            accentWord={accentWord}
            accent={p.accent}
            className={cn('mt-3 font-black leading-[0.92] tracking-tight', h1)}
          />
          <p
            className={cn('mt-2 opacity-70', large ? 'text-sm' : 'text-[10px]')}
            style={{ fontFamily: brand.typography.body }}
          >
            {sample.line}
          </p>
          <span
            className="mt-auto w-fit rounded-full px-2.5 py-1 font-semibold"
            style={{ background: p.primary, color: p.background, fontSize: large ? 11 : 8 }}
          >
            {sample.cta}
          </span>
        </div>
      )

    case 'knowledge':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black leading-tight', large ? 'text-xl' : 'text-[13px]')}>
            {sample.headline}
          </p>
          <ul className="mt-2 flex-1 space-y-1.5" style={{ fontFamily: brand.typography.body }}>
            {['01  Mở đầu rõ ý', '02  Ba lý do chính', '03  Việc cần làm'].map((row) => (
              <li key={row} className={cn('flex items-center gap-1.5', tiny)}>
                <span className="font-black tabular-nums" style={{ color: p.accent }}>
                  {row.slice(0, 2)}
                </span>
                <span className="h-px flex-1 opacity-20" style={{ background: ink }} />
                <span>{row.slice(4)}</span>
              </li>
            ))}
          </ul>
          <span
            className="mt-2 w-fit rounded-md px-2 py-0.5 font-semibold"
            style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 8 }}
          >
            Lưu bài
          </span>
        </div>
      )

    case 'photo-word':
      return (
        <div
          className="relative flex h-full flex-col justify-end"
          style={{
            background: `linear-gradient(180deg, ${p.primary} 0%, ${p.secondary} 42%, ${p.background} 100%)`,
          }}
        >
          <div className="absolute inset-x-6 top-8 h-1/2 rounded-sm opacity-30" style={{ background: p.accent }} />
          <div className={cn('relative', pad)}>
            <p className={cn('font-black uppercase leading-[0.8] tracking-tight', large ? 'text-5xl' : 'text-3xl')}>
              {accentWord || 'CHỌN'}
            </p>
            <p className={cn('mt-1 opacity-80', tiny)} style={{ fontFamily: brand.typography.body }}>
              {sample.line}
            </p>
          </div>
        </div>
      )

    case 'magazine':
      return (
        <div className="grid h-full grid-cols-[1.3fr_1fr]">
          <div className={cn('flex flex-col justify-end', pad)} style={{ background: p.primary }}>
            <p className={cn('font-black uppercase leading-[0.85]', large ? 'text-2xl' : 'text-[15px]')}>
              {sample.headline}
            </p>
          </div>
          <div className={cn('flex flex-col justify-between', pad)} style={{ background: paper, color: ink }}>
            <span className={cn('font-bold uppercase tracking-widest', tiny)} style={{ color: p.accent }}>
              {sample.kicker}
            </span>
            <p className={tiny} style={{ fontFamily: brand.typography.body }}>
              {sample.line}
            </p>
            <span className={cn('font-semibold', tiny)}>{sample.cta} →</span>
          </div>
        </div>
      )

    case 'story-white':
      return (
        <div className={cn('flex h-full flex-col items-center justify-center text-center', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black leading-[0.9]', large ? 'text-4xl' : 'text-xl')}>{sample.headline}</p>
          <span
            className="mt-auto rounded-full px-3 py-1 font-semibold"
            style={{ background: p.accent, color: p.background, fontSize: large ? 11 : 8 }}
          >
            {sample.cta}
          </span>
        </div>
      )

    case 'story-pastel':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: cream, color: ink }}>
          <span className={cn('w-fit rounded-full px-2 py-0.5 font-bold uppercase', tiny)} style={{ background: p.accent, color: p.background }}>
            {sample.kicker}
          </span>
          <Headline
            text={sample.headline}
            accentWord={accentWord}
            accent={p.accent}
            className={cn('mt-auto font-black leading-[0.9]', large ? 'text-3xl' : 'text-lg')}
          />
          <p className={cn('mt-2 mb-1 opacity-70', tiny)}>{sample.line}</p>
        </div>
      )

    case 'car-cinematic':
      return (
        <div className="flex h-full items-stretch gap-1 p-1.5" style={{ background: p.background }}>
          {[p.primary, p.secondary, p.accent].map((bg, i) => (
            <div key={bg} className="flex flex-1 flex-col justify-end rounded-md p-1.5" style={{ background: bg }}>
              <p className={cn('font-black leading-none', large ? 'text-lg' : 'text-[11px]')}>
                {['MỞ', 'Ý', 'CTA'][i]}
              </p>
            </div>
          ))}
        </div>
      )

    case 'car-xhs':
      return (
        <div className="flex h-full items-stretch gap-1 p-1.5" style={{ background: '#f8fafc' }}>
          {['01', '02', '03'].map((n, i) => (
            <div
              key={n}
              className="flex flex-1 flex-col rounded-md p-1.5"
              style={{ background: mix(p.accent, '#ffffff', 0.15 + i * 0.2), color: ink }}
            >
              <span className="font-black" style={{ color: p.accent, fontSize: large ? 18 : 12 }}>
                {n}
              </span>
              <span className={cn('mt-auto font-semibold', tiny)}>Ý {i + 1}</span>
            </div>
          ))}
        </div>
      )

    case 'vid-liquid':
      return (
        <div className="relative flex h-full items-center justify-center overflow-hidden" style={{ background: p.background }}>
          <div className="absolute -left-6 top-2 size-24 rounded-full opacity-50 blur-md" style={{ background: p.primary }} />
          <div className="absolute right-0 bottom-4 size-28 rounded-full opacity-40 blur-md" style={{ background: p.accent }} />
          <p className={cn('relative font-black', large ? 'text-3xl' : 'text-lg')}>{sample.headline}</p>
          <div
            className="absolute inset-x-0 bottom-0 overflow-hidden py-0.5"
            style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 7 }}
          >
            <span className="whitespace-nowrap font-semibold tracking-widest">
              {sample.line} · {sample.cta} · {sample.line}
            </span>
          </div>
        </div>
      )

    case 'vid-cursor':
      return (
        <div className={cn('flex h-full flex-col justify-center', pad)} style={{ background: p.background }}>
          <p className={cn('font-black leading-[0.95]', large ? 'text-3xl' : 'text-lg')}>
            {sample.headline}
            <span className="ml-0.5 inline-block h-[0.9em] w-0.5 animate-pulse align-middle" style={{ background: p.accent }} />
          </p>
          <p className={cn('mt-3 tracking-[0.35em] opacity-60', tiny)}>SCRAMBLE</p>
        </div>
      )

    case 'poster-sketch':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black leading-tight', large ? 'text-2xl' : 'text-base')}>{sample.headline}</p>
          <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
            <div className="rounded-full border-2 border-dashed opacity-60" style={{ borderColor: p.accent }} />
            <p className={tiny} style={{ fontFamily: brand.typography.body }}>
              {sample.line}
            </p>
          </div>
        </div>
      )

    case 'poster-mag':
      return (
        <div className={cn('flex h-full flex-col justify-between', pad)} style={{ background: p.primary }}>
          <span className={cn('uppercase tracking-widest opacity-70', tiny)}>{sample.kicker}</span>
          <p className={cn('font-black uppercase leading-[0.85]', large ? 'text-4xl' : 'text-2xl')}>
            {sample.headline}
          </p>
          <span className={tiny}>{sample.cta}</span>
        </div>
      )

    case 'deck-launch':
      return (
        <div className={cn('flex h-full flex-col justify-between', pad)} style={{ background: p.background }}>
          <span className={tiny} style={{ color: p.accent }}>
            01 / COVER
          </span>
          <p className={cn('max-w-[80%] font-black leading-[0.95]', large ? 'text-3xl' : 'text-lg')}>
            {sample.headline}
          </p>
          <span className={tiny} style={{ fontFamily: brand.typography.body }}>
            {brand.name}
          </span>
        </div>
      )

    case 'deck-swiss':
      return (
        <div className="grid h-full grid-cols-2" style={{ background: paper, color: ink }}>
          <div className={cn('border-r', pad)} style={{ borderColor: `${ink}22` }}>
            <p className={cn('font-black leading-tight', large ? 'text-xl' : 'text-[13px]')}>
              {sample.headline}
            </p>
          </div>
          <div className={cn('space-y-1.5', pad)} style={{ fontFamily: brand.typography.body }}>
            {['Ý chính một', 'Ý chính hai', 'Kêu gọi'].map((row) => (
              <p key={row} className={tiny}>
                — {row}
              </p>
            ))}
          </div>
        </div>
      )

    case 'info-dash':
      return (
        <div className={cn('grid h-full grid-cols-2 grid-rows-2 gap-1.5', pad)} style={{ background: p.background }}>
          {['1.2k', '95%', '12', '4.9'].map((n, i) => (
            <div key={n} className="flex flex-col justify-end rounded-md p-1.5" style={{ background: i === 0 ? p.primary : `${paper}14` }}>
              <p className={cn('font-black tabular-nums', large ? 'text-2xl' : 'text-base')}>{n}</p>
              <p className={tiny} style={{ opacity: 0.7 }}>
                Chỉ số
              </p>
            </div>
          ))}
        </div>
      )

    case 'land-soft':
      return (
        <div className="grid h-full grid-cols-2" style={{ background: cream, color: ink }}>
          <div className={cn('flex flex-col justify-center', pad)}>
            <p className={cn('font-black leading-tight', large ? 'text-xl' : 'text-[13px]')}>
              {sample.headline}
            </p>
            <span
              className="mt-2 w-fit rounded-full px-2 py-0.5 font-semibold"
              style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 7 }}
            >
              {sample.cta}
            </span>
          </div>
          <div className="m-2 rounded-lg border opacity-80" style={{ borderColor: `${ink}22`, background: paper }} />
        </div>
      )

    case 'event-wait':
      return (
        <div className={cn('flex h-full flex-col items-center justify-center text-center', pad)} style={{ background: paper, color: ink }}>
          {brand.logoDataUrl ? (
            <img src={brand.logoDataUrl} alt="" className="mb-2 h-8 w-auto max-w-[40%] object-contain" />
          ) : (
            <span className={cn('mb-2 font-bold uppercase tracking-widest', tiny)}>{brand.name}</span>
          )}
          <p className={cn('font-black', large ? 'text-xl' : 'text-sm')}>{sample.headline}</p>
          <p className={cn('mt-1 opacity-70', tiny)}>19:00 · 20/09</p>
          <span className="mt-2 rounded-full px-2.5 py-0.5 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'sheet-doc':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: '#f4efe4', color: '#3f3a32' }}>
          <p className={cn('font-bold', large ? 'text-lg' : 'text-[12px]')}>{sample.headline}</p>
          <div className="mt-2 flex-1 space-y-1.5 opacity-50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-1 rounded-full" style={{ background: ink, width: `${90 - i * 8}%` }} />
            ))}
          </div>
        </div>
      )

    case 'sheet-email':
      return (
        <div className="flex h-full flex-col" style={{ background: '#e2e8f0' }}>
          <div className="px-2 py-1.5" style={{ background: p.primary }}>
            <p className={cn('font-bold', tiny)}>{sample.headline}</p>
          </div>
          <div className={cn('m-1.5 flex-1 space-y-1 rounded-sm', pad)} style={{ background: '#fff', color: ink }}>
            <div className="h-8 rounded-sm" style={{ background: cream }} />
            <div className="h-6 rounded-sm opacity-40" style={{ background: p.secondary }} />
            <span className="inline-block rounded px-1.5 py-0.5" style={{ background: p.accent, color: p.background, fontSize: 7 }}>
              {sample.cta}
            </span>
          </div>
        </div>
      )

    case 'sheet-brochure':
      return (
        <div className="grid h-full grid-cols-3 gap-px" style={{ background: ink }}>
          {[p.primary, paper, cream].map((bg, i) => (
            <div key={bg} className="flex flex-col justify-end p-1.5" style={{ background: bg, color: i === 0 ? p.text : ink }}>
              <p className={tiny}>{['Bìa', 'Lợi ích', 'Liên hệ'][i]}</p>
            </div>
          ))}
        </div>
      )

    case 'cert-formal':
      return (
        <div className={cn('flex h-full flex-col items-center justify-center border-8 text-center', pad)} style={{ background: paper, color: ink, borderColor: p.accent }}>
          <p className={cn('uppercase tracking-[0.3em]', tiny)}>Chứng nhận</p>
          <p className={cn('mt-2 font-black', large ? 'text-2xl' : 'text-base')}>Nguyễn Văn A</p>
          <p className={tiny}>{sample.line}</p>
        </div>
      )

    case 'resume-col':
      return (
        <div className="grid h-full grid-cols-[0.8fr_1.2fr]" style={{ color: ink }}>
          <div className={pad} style={{ background: p.primary, color: p.text }}>
            <p className={cn('font-black', tiny)}>Họ tên</p>
            <p className={cn('mt-2 opacity-70', tiny)}>Kỹ năng</p>
          </div>
          <div className={pad} style={{ background: paper }}>
            <p className={cn('font-bold', tiny)}>{sample.headline}</p>
            <div className="mt-2 space-y-1 opacity-40">
              <div className="h-1 w-4/5 rounded-full" style={{ background: ink }} />
              <div className="h-1 w-3/5 rounded-full" style={{ background: ink }} />
            </div>
          </div>
        </div>
      )

    case 'worksheet':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-bold', large ? 'text-sm' : 'text-[11px]')}>{sample.headline}</p>
          {[1, 2, 3].map((n) => (
            <div key={n} className="mt-2">
              <p className={tiny}>Câu {n}.</p>
              <div className="mt-0.5 h-px w-full opacity-30" style={{ background: ink }} />
            </div>
          ))}
        </div>
      )

    case 'quiz':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-bold', large ? 'text-sm' : 'text-[11px]')}>Câu 1. {sample.headline}?</p>
          <div className="mt-2 space-y-1">
            {['A', 'B', 'C'].map((opt) => (
              <div key={opt} className={cn('flex items-center gap-1.5 rounded border px-1.5 py-0.5', tiny)} style={{ borderColor: `${ink}22` }}>
                <span className="font-black" style={{ color: p.accent }}>
                  {opt}
                </span>
                Đáp án {opt}
              </div>
            ))}
          </div>
        </div>
      )

    case 'quote-center':
      return (
        <div className={cn('flex h-full flex-col items-center justify-center text-center', pad)} style={{ background: paper, color: ink }}>
          <span className="font-black leading-none opacity-30" style={{ color: p.accent, fontSize: large ? 48 : 28 }}>
            “
          </span>
          <p className={cn('font-bold leading-snug', large ? 'text-xl' : 'text-[13px]')}>{sample.headline}</p>
          <p className={cn('mt-2 opacity-60', tiny)}>— {brand.name}</p>
        </div>
      )

    case 'checklist':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black', large ? 'text-lg' : 'text-[13px]')}>{sample.headline}</p>
          <ul className="mt-2 flex-1 space-y-1.5">
            {['Việc 1', 'Việc 2', 'Việc 3', 'Việc 4'].map((row) => (
              <li key={row} className={cn('flex items-center gap-1.5', tiny)}>
                <span className="flex size-3 items-center justify-center rounded-sm text-[7px] font-black" style={{ background: p.accent, color: p.background }}>
                  ✓
                </span>
                {row}
              </li>
            ))}
          </ul>
        </div>
      )

    case 'event-date':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: p.primary, color: p.text }}>
          <span className={tiny}>{sample.kicker}</span>
          <p className={cn('mt-1 font-black tabular-nums leading-none', large ? 'text-6xl' : 'text-4xl')}>12</p>
          <p className={cn('font-bold', large ? 'text-lg' : 'text-[12px]')}>Tháng 9</p>
          <p className={cn('mt-auto', tiny)}>{sample.headline}</p>
          <span className="mt-1 w-fit rounded-full px-2 py-0.5 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'offer-price':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: cream, color: ink }}>
          <span className="w-fit rounded px-1.5 py-0.5 font-black uppercase" style={{ background: p.accent, color: p.background, fontSize: large ? 11 : 8 }}>
            −30%
          </span>
          <p className={cn('mt-2 font-black leading-tight', large ? 'text-xl' : 'text-[13px]')}>{sample.headline}</p>
          <p className={cn('mt-auto font-black tabular-nums', large ? 'text-4xl' : 'text-2xl')} style={{ color: p.accent }}>
            990k
          </p>
          <p className={cn('line-through opacity-40', tiny)}>1.490k</p>
          <span className="mt-1 w-fit rounded-full px-2 py-0.5 font-semibold" style={{ background: p.primary, color: p.background, fontSize: large ? 10 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'product-split':
      return (
        <div className="grid h-full grid-cols-2">
          <div style={{ background: `linear-gradient(160deg, ${p.primary}, ${p.secondary})` }} />
          <div className={cn('flex flex-col justify-end', pad)} style={{ background: paper, color: ink }}>
            <p className={cn('font-black leading-tight', large ? 'text-base' : 'text-[11px]')}>{sample.headline}</p>
            <p className={cn('mt-1 opacity-70', tiny)}>{sample.line}</p>
            <span className="mt-2 font-bold" style={{ color: p.accent, fontSize: large ? 12 : 9 }}>
              {sample.cta}
            </span>
          </div>
        </div>
      )

    case 'menu-card':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black', large ? 'text-base' : 'text-[12px]')}>{brand.name}</p>
          <ul className="mt-2 flex-1 space-y-1" style={{ fontFamily: brand.typography.body }}>
            {['Món A · 89k', 'Món B · 75k', 'Món C · 62k'].map((row) => (
              <li key={row} className={cn('flex justify-between border-b border-dashed', tiny)} style={{ borderColor: `${ink}33` }}>
                {row}
              </li>
            ))}
          </ul>
          <span className="mt-2 w-fit rounded-full px-2 py-0.5 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'hours-cta':
      return (
        <div className={cn('flex h-full flex-col items-center justify-center text-center', pad)} style={{ background: cream, color: ink }}>
          <p className={cn('font-black', large ? 'text-lg' : 'text-[13px]')}>{brand.name}</p>
          <p className={cn('mt-2 font-black tabular-nums', large ? 'text-2xl' : 'text-base')}>08:00 – 21:00</p>
          <p className={cn('mt-1 opacity-70', tiny)}>{sample.line}</p>
          <span className="mt-3 rounded-full px-3 py-1 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 11 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'metric-hero':
      return (
        <div className={cn('flex h-full flex-col justify-end', pad)} style={{ background: p.background }}>
          <p className={cn('font-black tabular-nums leading-none', large ? 'text-6xl' : 'text-4xl')} style={{ color: p.accent }}>
            95%
          </p>
          <p className={cn('mt-1 font-bold', large ? 'text-base' : 'text-[12px]')}>{sample.headline}</p>
          <p className={cn('opacity-70', tiny)}>{sample.line}</p>
        </div>
      )

    case 'feature-ui':
      return (
        <div className="grid h-full grid-cols-2" style={{ background: p.background }}>
          <div className={cn('flex flex-col justify-center', pad)}>
            <p className={cn('font-black leading-tight', large ? 'text-lg' : 'text-[12px]')}>{sample.headline}</p>
            <span className="mt-2 w-fit rounded-full px-2 py-0.5 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 7 }}>
              {sample.cta}
            </span>
          </div>
          <div className="m-2 rounded-xl border" style={{ borderColor: `${p.text}22`, background: paper }} />
        </div>
      )

    case 'calm-tip':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: cream, color: ink }}>
          <span className={cn('w-fit rounded-full px-2 py-0.5 font-bold uppercase', tiny)} style={{ background: p.secondary, color: p.background }}>
            Mẹo
          </span>
          <p className={cn('mt-3 font-black leading-tight', large ? 'text-xl' : 'text-[14px]')}>{sample.headline}</p>
          <p className={cn('mt-2 opacity-70', tiny)}>{sample.line}</p>
          <span className="mt-auto w-fit rounded-full px-2 py-0.5 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'trust-badge':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black', large ? 'text-lg' : 'text-[13px]')}>{sample.headline}</p>
          <div className="mt-3 flex gap-1.5">
            {['ISO', 'Bộ Y tế', 'Phụ huynh'].map((label) => (
              <span
                key={label}
                className="flex size-10 flex-col items-center justify-center rounded-full border text-center"
                style={{ borderColor: p.accent, fontSize: 6 }}
              >
                {label}
              </span>
            ))}
          </div>
          <p className={cn('mt-auto opacity-70', tiny)}>{sample.line}</p>
        </div>
      )

    case 'story-offer':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: p.primary, color: p.text }}>
          <span className="w-fit rounded px-1.5 py-0.5 font-black" style={{ background: p.accent, color: p.background, fontSize: large ? 11 : 8 }}>
            SALE
          </span>
          <p className={cn('mt-auto font-black tabular-nums leading-none', large ? 'text-5xl' : 'text-3xl')}>−40%</p>
          <p className={cn('mt-2', tiny)}>{sample.headline}</p>
          <span className="mt-2 w-fit rounded-full px-2 py-0.5 font-semibold" style={{ background: p.accent, color: p.background, fontSize: large ? 10 : 8 }}>
            {sample.cta}
          </span>
        </div>
      )

    case 'vid-kinetic':
      return (
        <div className={cn('flex h-full flex-col justify-center', pad)} style={{ background: p.background }}>
          <p className={cn('font-black uppercase leading-[0.85]', large ? 'text-4xl' : 'text-2xl')}>
            {sample.headline.split(' ').slice(0, 2).join('\n')}
          </p>
        </div>
      )

    case 'vid-stat':
      return (
        <div className={cn('flex h-full flex-col justify-center', pad)} style={{ background: p.background }}>
          <p className={cn('font-black tabular-nums leading-none', large ? 'text-6xl' : 'text-4xl')} style={{ color: p.accent }}>
            3
          </p>
          <p className={cn('mt-2 font-bold', large ? 'text-lg' : 'text-[13px]')}>{sample.headline}</p>
        </div>
      )

    case 'vid-warm':
      return (
        <div className={cn('relative flex h-full items-end', pad)} style={{ background: `linear-gradient(180deg, ${p.secondary}, ${p.background})` }}>
          <p className={cn('max-w-[80%] font-black leading-tight', large ? 'text-2xl' : 'text-sm')}>{sample.headline}</p>
        </div>
      )

    case 'land-saas':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: p.background }}>
          <p className={cn('max-w-[70%] font-black leading-tight', large ? 'text-xl' : 'text-[13px]')}>{sample.headline}</p>
          <div className="mt-auto h-1/2 rounded-md" style={{ background: paper, opacity: 0.15 }} />
        </div>
      )

    case 'poster-hero':
      return (
        <div className={cn('flex h-full flex-col justify-between', pad)} style={{ background: p.primary }}>
          <p className={cn('font-black tabular-nums', large ? 'text-5xl' : 'text-3xl')}>12.09</p>
          <p className={cn('font-black uppercase leading-[0.9]', large ? 'text-2xl' : 'text-sm')}>{sample.headline}</p>
          <span className={tiny}>{sample.cta}</span>
        </div>
      )

    case 'deck-course':
      return (
        <div className={cn('flex h-full flex-col', pad)} style={{ background: paper, color: ink }}>
          <span className={tiny} style={{ color: p.accent }}>
            BUỔI 03
          </span>
          <p className={cn('mt-1 font-black', large ? 'text-xl' : 'text-[13px]')}>{sample.headline}</p>
          <ul className={cn('mt-auto space-y-1', tiny)}>
            <li>— Ý 1</li>
            <li>— Ý 2</li>
            <li>— Ý 3</li>
          </ul>
        </div>
      )

    default:
      return (
        <div className={cn('flex h-full flex-col justify-center', pad)} style={{ background: paper, color: ink }}>
          <p className={cn('font-black leading-tight', h1)}>{sample.headline}</p>
          <p className={cn('mt-2 opacity-70', tiny)}>{sample.line}</p>
        </div>
      )
  }
}
