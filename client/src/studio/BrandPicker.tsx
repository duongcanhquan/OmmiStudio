import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  Type,
  Volume2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  BRAND_INDUSTRY_LABELS,
  emptyBrandDraft,
  loadCustomBrands,
  saveCustomBrands,
  type BrandIndustry,
  type StudioBrand,
} from '../lib/brands'
import { cn } from '../lib/utils'
import { useStudio } from './StudioContext'

const INDUSTRIES = Object.keys(BRAND_INDUSTRY_LABELS) as BrandIndustry[]

export function BrandPicker() {
  const { brands, assetsLoading, selection, patchSelection, upsertBrand, removeBrand } =
    useStudio()
  const [industryFilter, setIndustryFilter] = useState<BrandIndustry | 'all'>(
    'all'
  )
  const [editing, setEditing] = useState<StudioBrand | null>(null)

  const filtered = useMemo(() => {
    if (industryFilter === 'all') return brands
    return brands.filter((b) => b.industry === industryFilter)
  }, [brands, industryFilter])

  function openCreate() {
    setEditing(emptyBrandDraft())
  }

  function openEdit(brand: StudioBrand) {
    setEditing({ ...brand, palette: { ...brand.palette }, typography: { ...brand.typography }, voice: { ...brand.voice, keywords: [...brand.voice.keywords] } })
  }

  function persist(brand: StudioBrand) {
    if (!brand.name.trim()) return
    upsertBrand(brand)
    const customs = loadCustomBrands().filter((b) => b.id !== brand.id)
    customs.push({ ...brand, custom: true })
    saveCustomBrands(customs)
    patchSelection({ selectedBrand: brand })
    setEditing(null)
  }

  function handleDelete(brand: StudioBrand) {
    if (!brand.custom && !brand.path?.includes('custom')) {
      // still allow removing user-overridden copies stored as custom
    }
    if (!window.confirm(`Xóa thương hiệu «${brand.name}»?`)) return
    removeBrand(brand.id)
    const customs = loadCustomBrands().filter((b) => b.id !== brand.id)
    saveCustomBrands(customs)
    if (selection.selectedBrand?.id === brand.id) {
      patchSelection({ selectedBrand: brands.find((b) => b.id !== brand.id) ?? null })
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-50">
            Thương hiệu
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Preset sẵn (giáo dục, thương mại…) — xem rõ palette, font, tone; thêm
            / sửa để customize.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          <Plus className="size-4" aria-hidden />
          Thêm thương hiệu
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={industryFilter === 'all'}
          onClick={() => setIndustryFilter('all')}
          label="Tất cả ngành"
        />
        {INDUSTRIES.map((id) => (
          <FilterChip
            key={id}
            active={industryFilter === id}
            onClick={() => setIndustryFilter(id)}
            label={BRAND_INDUSTRY_LABELS[id]}
          />
        ))}
      </div>

      {assetsLoading ? (
        <p className="text-sm text-slate-500">Đang tải…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((brand, index) => {
            const selected = selection.selectedBrand?.id === brand.id
            return (
              <motion.article
                key={brand.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.2) }}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 backdrop-blur-md transition-shadow',
                  selected
                    ? 'border-cyan-400/55 bg-slate-900/80 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                    : 'border-slate-800 bg-slate-950/60'
                )}
              >
                <button
                  type="button"
                  onClick={() => patchSelection({ selectedBrand: brand })}
                  className="w-full cursor-pointer text-left"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-slate-50">
                        {brand.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-cyan-400/80">
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

                  {/* Palette swatches */}
                  <div className="mb-3 flex items-center gap-1.5" aria-label="Bảng màu">
                    {(
                      [
                        brand.palette.primary,
                        brand.palette.secondary,
                        brand.palette.accent,
                        brand.palette.background,
                        brand.palette.text,
                      ] as string[]
                    ).map((c, i) => (
                      <span
                        key={`${brand.id}-c-${i}`}
                        title={c}
                        className="size-6 rounded-md ring-1 ring-white/15"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <Type className="size-3.5 text-slate-500" aria-hidden />
                      <span>
                        <span className="text-slate-300">{brand.typography.heading}</span>
                        {' / '}
                        {brand.typography.body}
                      </span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Volume2 className="mt-0.5 size-3.5 shrink-0 text-slate-500" aria-hidden />
                      <span className="line-clamp-2">{brand.voice.tone || '—'}</span>
                    </p>
                    {brand.voice.keywords.length > 0 && (
                      <p className="flex flex-wrap gap-1 pt-1">
                        {brand.voice.keywords.slice(0, 4).map((k) => (
                          <span
                            key={k}
                            className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                          >
                            {k}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </button>

                <div className="mt-3 flex gap-2 border-t border-slate-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(brand)}
                    className="inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Sửa
                  </button>
                  {brand.custom && (
                    <button
                      type="button"
                      onClick={() => handleDelete(brand)}
                      className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-500/30 px-3 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <BrandEditorModal
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

function FilterChip({
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
        'min-h-9 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
          : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
      )}
    >
      {label}
    </button>
  )
}

function BrandEditorModal({
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
      aria-label="Chỉnh sửa thương hiệu"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        className="studio-scrollbar max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">
            {brand.custom ? 'Thương hiệu tùy chỉnh' : 'Chỉnh sửa thương hiệu'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Tên thương hiệu *">
            <input
              className={inputClass}
              value={brand.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              className={cn(inputClass, 'min-h-20')}
              value={brand.description ?? ''}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </Field>
          <Field label="Ngành">
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
          </Field>

          <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bảng màu
          </p>
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
                  value={brand.palette[key]}
                  onChange={(e) =>
                    patch({
                      palette: { ...brand.palette, [key]: e.target.value },
                      accent:
                        key === 'primary' ? e.target.value : brand.accent,
                    })
                  }
                  className="h-10 w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-900"
                />
              </label>
            ))}
          </div>

          <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Typography
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Font tiêu đề">
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
            </Field>
            <Field label="Font nội dung">
              <input
                className={inputClass}
                value={brand.typography.body}
                onChange={(e) =>
                  patch({
                    typography: { ...brand.typography, body: e.target.value },
                  })
                }
              />
            </Field>
          </div>

          <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tone giọng
          </p>
          <Field label="Tone">
            <input
              className={inputClass}
              value={brand.voice.tone}
              onChange={(e) =>
                patch({ voice: { ...brand.voice, tone: e.target.value } })
              }
              placeholder="Thân thiện · chuyên nghiệp…"
            />
          </Field>
          <Field label="Từ khóa (phân tách bằng dấu phẩy)">
            <input
              className={inputClass}
              value={brand.voice.keywords.join(', ')}
              onChange={(e) =>
                patch({
                  voice: {
                    ...brand.voice,
                    keywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Nên nói">
              <input
                className={inputClass}
                value={brand.voice.doSay}
                onChange={(e) =>
                  patch({ voice: { ...brand.voice, doSay: e.target.value } })
                }
              />
            </Field>
            <Field label="Tránh nói">
              <input
                className={inputClass}
                value={brand.voice.dontSay}
                onChange={(e) =>
                  patch({ voice: { ...brand.voice, dontSay: e.target.value } })
                }
              />
            </Field>
          </div>
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
            onClick={onSave}
            disabled={!brand.name.trim()}
            className="min-h-11 cursor-pointer rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 disabled:opacity-40"
          >
            Lưu thương hiệu
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  )
}

const inputClass = cn(
  'min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100',
  'focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'
)
