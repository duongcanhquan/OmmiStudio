import type { StudioBrand } from '../lib/brands'
import type { PreviewFrame } from '../lib/templateCatalog'
import { cn } from '../lib/utils'

export const PREVIEW_SAMPLE: Record<
  StudioBrand['industry'],
  { kicker: string; headline: string; line: string; cta: string }
> = {
  education: {
    kicker: 'Ngày hội',
    headline: 'Chọn trường cho con',
    line: 'Ba lý do phụ huynh tin tưởng.',
    cta: 'Đăng ký tham quan',
  },
  hospitality: {
    kicker: 'Không gian',
    headline: 'Về một chiều chậm',
    line: 'Bàn nhỏ, ánh đèn ấm, chuyện dài.',
    cta: 'Giữ chỗ',
  },
  commerce: {
    kicker: 'Tuần này',
    headline: 'Ưu đãi rõ ràng',
    line: 'Một lời mời, một việc cần làm.',
    cta: 'Xem ưu đãi',
  },
  tech: {
    kicker: 'Ra mắt',
    headline: 'Làm việc nhẹ hơn',
    line: 'Ít bước hơn. Kết quả rõ hơn.',
    cta: 'Dùng thử',
  },
  healthcare: {
    kicker: 'Chăm sóc',
    headline: 'An tâm từng bước',
    line: 'Thông tin đủ, giọng nhẹ nhàng.',
    cta: 'Đặt lịch',
  },
  nonprofit: {
    kicker: 'Cùng làm',
    headline: 'Một việc hôm nay',
    line: 'Đóng góp nhỏ, hiệu quả thấy được.',
    cta: 'Tham gia',
  },
  general: {
    kicker: 'Mẫu xem trước',
    headline: 'Tiêu đề của bạn',
    line: 'Một câu phụ ngắn, dễ đọc.',
    cta: 'Liên hệ',
  },
}

const FRAME_CLASS: Record<PreviewFrame, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-video',
  stack: 'aspect-square',
  sheet: 'aspect-[3/4]',
  slides: 'aspect-video',
}

export function LookPreview({
  brand,
  frame = 'square',
  large,
}: {
  brand: StudioBrand
  frame?: PreviewFrame
  large?: boolean
}) {
  const sample = PREVIEW_SAMPLE[brand.industry] ?? PREVIEW_SAMPLE.general
  const p = brand.palette
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        FRAME_CLASS[frame],
        large ? 'rounded-2xl shadow-2xl' : 'rounded-lg'
      )}
      style={{
        background: `linear-gradient(160deg, ${p.primary} 0%, ${p.background} 58%)`,
        color: p.text,
        fontFamily: `${brand.typography.heading}, Be Vietnam Pro, system-ui, sans-serif`,
      }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full opacity-40"
        style={{ background: p.accent }}
      />
      <div
        className="pointer-events-none absolute bottom-6 left-8 size-20 rounded-full opacity-25"
        style={{ background: p.secondary }}
      />
      <div className={cn('relative flex h-full flex-col', large ? 'p-6' : 'p-3')}>
        <div className="flex items-center gap-2">
          {brand.logoDataUrl ? (
            <img
              src={brand.logoDataUrl}
              alt=""
              className="h-7 w-auto max-w-[4.5rem] rounded bg-white/90 object-contain p-0.5"
            />
          ) : (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: p.accent, color: p.background }}
            >
              {sample.kicker}
            </span>
          )}
          <span className="truncate text-[10px] font-medium opacity-80">
            {brand.name}
          </span>
        </div>
        <div className="mt-auto space-y-1.5">
          <p
            className={cn(
              'font-black leading-[0.95] tracking-tight',
              large ? 'text-3xl' : 'text-lg'
            )}
          >
            {sample.headline}
          </p>
          <p
            className={cn(
              'opacity-80',
              large ? 'text-sm' : 'text-[10px] leading-snug'
            )}
            style={{
              fontFamily: `${brand.typography.body}, Inter, system-ui, sans-serif`,
            }}
          >
            {sample.line}
          </p>
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[9px] font-semibold"
            style={{ background: p.accent, color: p.background }}
          >
            {sample.cta}
          </span>
        </div>
      </div>
    </div>
  )
}
