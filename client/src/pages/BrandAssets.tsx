import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  Type,
  Volume2,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BRAND_INDUSTRY_LABELS,
  DEFAULT_BRAND_PRESETS,
  emptyBrandDraft,
  loadCustomBrands,
  mergeBrandSources,
  saveCustomBrands,
  type BrandIndustry,
  type StudioBrand,
} from '../lib/brands'
import { fetchBrands } from '../api/engine'
import { cn } from '../lib/utils'

interface BrandAssetsPageProps {
  onNotify?: (message: string, isError?: boolean) => void
  onUseInStudio?: (brandId?: string) => void
}

const INDUSTRIES = Object.keys(BRAND_INDUSTRY_LABELS) as BrandIndustry[]

export function BrandAssetsPage({
  onNotify,
  onUseInStudio,
}: BrandAssetsPageProps) {
  const [brands, setBrands] = useState<StudioBrand[]>(DEFAULT_BRAND_PRESETS)
  const [loading, setLoading] = useState(true)
  const [industryFilter, setIndustryFilter] = useState<BrandIndustry | 'all'>(
    'all'
  )
  const [editing, setEditing] = useState<StudioBrand | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const api = await fetchBrands()
        if (cancelled) return
        const merged = mergeBrandSources(api)
        setBrands(merged)
        setSelectedId((prev) => prev ?? merged[0]?.id ?? null)
      } catch {
        if (cancelled) return
        const merged = mergeBrandSources([])
        setBrands(merged)
        setSelectedId(merged[0]?.id ?? null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (industryFilter === 'all') return brands
    return brands.filter((b) => b.industry === industryFilter)
  }, [brands, industryFilter])

  function persist(brand: StudioBrand) {
    if (!brand.name.trim()) return
    setBrands((prev) => {
      const i = prev.findIndex((b) => b.id === brand.id)
      const next =
        i === -1
          ? [...prev, { ...brand, custom: true }]
          : prev.map((b, idx) =>
              idx === i ? { ...brand, custom: true } : b
            )
      return next.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    })
    const customs = loadCustomBrands().filter((b) => b.id !== brand.id)
    customs.push({ ...brand, custom: true })
    saveCustomBrands(customs)
    setSelectedId(brand.id)
    setEditing(null)
    onNotify?.('Đã lưu mẫu.')
  }

  function handleDelete(brand: StudioBrand) {
    if (!window.confirm(`Xóa mẫu «${brand.name}»?`)) return
    setBrands((prev) => prev.filter((b) => b.id !== brand.id))
    saveCustomBrands(loadCustomBrands().filter((b) => b.id !== brand.id))
    if (selectedId === brand.id) setSelectedId(null)
    onNotify?.('Đã xóa mẫu tùy chỉnh.')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950">
      <div className="border-b border-slate-800/80 px-4 py-3 sm:px-5 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/80">
              Thư viện
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
              Thư viện mẫu
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Màu, chữ, logo — diện mạo file khi chọn mẫu trong Studio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onUseInStudio?.(selectedId ?? undefined)}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-medium text-slate-200 hover:border-slate-500"
            >
              Mở Studio
            </button>
            <button
              type="button"
              onClick={() => setEditing(emptyBrandDraft())}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <Plus className="size-4" aria-hidden />
              Thêm mẫu
            </button>
          </div>
        </div>
      </div>

      <div className="studio-scrollbar w-full flex-1 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip
            active={industryFilter === 'all'}
            onClick={() => setIndustryFilter('all')}
            label="Tất cả ngành"
          />
          {INDUSTRIES.map((id) => (
            <Chip
              key={id}
              active={industryFilter === id}
              onClick={() => setIndustryFilter(id)}
              label={BRAND_INDUSTRY_LABELS[id]}
            />
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Đang tải…</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((brand) => {
              const selected = selectedId === brand.id
              return (
                <article
                  key={brand.id}
                  className={cn(
                    'rounded-2xl border p-4',
                    selected
                      ? 'border-cyan-400/50 bg-cyan-500/5'
                      : 'border-slate-800 bg-slate-950/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(brand.id)}
                    className="w-full cursor-pointer text-left"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-50">
                          {brand.name}
                        </p>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-400/80">
                          {BRAND_INDUSTRY_LABELS[brand.industry]}
                        </p>
                      </div>
                      {selected && (
                        <span className="flex size-7 items-center justify-center rounded-full bg-cyan-500 text-slate-950">
                          <Check className="size-4" aria-hidden />
                        </span>
                      )}
                    </div>
                    <p className="mb-3 line-clamp-2 text-xs text-slate-400">
                      {brand.description || 'Bộ nhận diện'}
                    </p>
                    <div className="mb-3 flex gap-1.5">
                      {[
                        brand.palette.primary,
                        brand.palette.secondary,
                        brand.palette.accent,
                        brand.palette.background,
                        brand.palette.text,
                      ].map((c, i) => (
                        <span
                          key={`${brand.id}-${i}`}
                          className="size-6 rounded-md ring-1 ring-white/15"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Type className="size-3.5 text-slate-500" aria-hidden />
                      {brand.typography.heading} / {brand.typography.body}
                    </p>
                    <p className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-400">
                      <Volume2
                        className="mt-0.5 size-3.5 shrink-0 text-slate-500"
                        aria-hidden
                      />
                      <span className="line-clamp-2">
                        {brand.voice.tone || '—'}
                      </span>
                    </p>
                  </button>
                  <div className="mt-3 flex gap-2 border-t border-slate-800/80 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...brand })}
                      className="inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Sửa
                    </button>
                    {brand.custom && (
                      <button
                        type="button"
                        onClick={() => handleDelete(brand)}
                        className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-red-500/30 px-3 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <BrandEditModal
            brand={editing}
            onChange={setEditing}
            onClose={() => setEditing(null)}
            onSave={() => persist(editing)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-9 cursor-pointer rounded-full border px-3 text-xs font-medium',
        active
          ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
          : 'border-slate-700 text-slate-400 hover:border-slate-500'
      )}
    >
      {label}
    </button>
  )
}

function BrandEditModal({
  brand,
  onChange,
  onClose,
  onSave,
}: {
  brand: StudioBrand
  onChange: (b: StudioBrand) => void
  onClose: () => void
  onSave: () => void
}) {
  const patch = (partial: Partial<StudioBrand>) =>
    onChange({ ...brand, ...partial })

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="studio-scrollbar max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">
            Chỉnh sửa mẫu
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Tên *</span>
            <input
              className={inputClass}
              value={brand.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Mô tả</span>
            <textarea
              className={cn(inputClass, 'min-h-20')}
              value={brand.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Ngành</span>
            <select
              className={inputClass}
              value={brand.industry}
              onChange={(e) =>
                patch({ industry: e.target.value as BrandIndustry })
              }
            >
              {INDUSTRIES.map((id) => (
                <option key={id} value={id}>
                  {BRAND_INDUSTRY_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ['primary', 'Chính'],
                ['secondary', 'Phụ'],
                ['accent', 'Nhấn'],
                ['background', 'Nền'],
                ['text', 'Chữ'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="space-y-1 text-xs text-slate-400">
                <span>{label}</span>
                <input
                  type="color"
                  className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-900"
                  value={brand.palette[key]}
                  onChange={(e) =>
                    patch({
                      palette: { ...brand.palette, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Font tiêu đề</span>
              <input
                className={inputClass}
                value={brand.typography.heading}
                onChange={(e) =>
                  patch({
                    typography: {
                      ...brand.typography,
                      heading: e.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Font nội dung</span>
              <input
                className={inputClass}
                value={brand.typography.body}
                onChange={(e) =>
                  patch({
                    typography: { ...brand.typography, body: e.target.value },
                  })
                }
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Tone giọng</span>
            <input
              className={inputClass}
              value={brand.voice.tone}
              onChange={(e) =>
                patch({ voice: { ...brand.voice, tone: e.target.value } })
              }
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 cursor-pointer rounded-xl border border-slate-700 px-4 text-sm text-slate-300"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!brand.name.trim()}
            onClick={onSave}
            className="min-h-11 cursor-pointer rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 disabled:opacity-40"
          >
            Lưu
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const inputClass = cn(
  'min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100',
  'focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'
)

export default BrandAssetsPage
