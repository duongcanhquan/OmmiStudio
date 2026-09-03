import { AnimatePresence, motion } from 'framer-motion'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  BRAND_INDUSTRY_LABELS,
  emptyBrandDraft,
  loadCustomBrands,
  saveCustomBrands,
  type BrandIndustry,
  type StudioBrand,
} from '../lib/brands'
import {
  LAYOUT_STYLE_LABELS,
  defaultLayoutId,
  layoutById,
  layoutsForLoai,
  layoutsForLoaiStyle,
  styleOf,
  stylesForLoai,
  type LayoutStyle,
  type StudioLayout,
} from '../lib/layoutCatalog'
import { catalogById, type PreviewFrame } from '../lib/templateCatalog'
import { cn } from '../lib/utils'
import { useStudio } from './StudioContext'
import { MediaFields } from './MediaFields'
import { LayoutPreview } from './LayoutPreview'
import { LookPreview } from './LookPreview'

const INDUSTRIES = Object.keys(BRAND_INDUSTRY_LABELS) as BrandIndustry[]

export function BrandPicker() {
  const { brands, assetsLoading, selection, patchSelection, upsertBrand, removeBrand } =
    useStudio()
  const [industryFilter, setIndustryFilter] = useState<BrandIndustry | 'all'>(
    'all'
  )
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle | 'all'>('all')
  const [editing, setEditing] = useState<StudioBrand | null>(null)

  const filtered = useMemo(() => {
    if (industryFilter === 'all') return brands
    return brands.filter((b) => b.industry === industryFilter)
  }, [brands, industryFilter])
  const loaiId = selection.selectedTemplate?.id ?? ''
  const frame =
    catalogById(loaiId)?.frame ?? 'square'
  const loaiName = selection.selectedTemplate?.name ?? 'sản phẩm đã chọn'
  const activeBrand = selection.selectedBrand ?? brands[0] ?? null
  const allLayouts = layoutsForLoai(loaiId)
  const styleOptions = stylesForLoai(loaiId)
  const layouts = layoutsForLoaiStyle(loaiId, layoutStyle)
  const activeLayout =
    layoutById(selection.layoutId) ?? layouts[0] ?? null

  useEffect(() => {
    setLayoutStyle('all')
  }, [loaiId])

  useEffect(() => {
    const nextLayout = defaultLayoutId(loaiId)
    if (!loaiId || !nextLayout) return
    const stillValid = layoutsForLoai(loaiId).some(
      (layout) => layout.id === selection.layoutId
    )
    if (!stillValid) {
      patchSelection({ layoutId: nextLayout })
    }
  }, [loaiId, selection.layoutId, patchSelection])

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
    if (!window.confirm(`Xóa mẫu «${brand.name}»?`)) return
    removeBrand(brand.id)
    const customs = loadCustomBrands().filter((b) => b.id !== brand.id)
    saveCustomBrands(customs)
    if (selection.selectedBrand?.id === brand.id) {
      patchSelection({ selectedBrand: brands.find((b) => b.id !== brand.id) ?? null })
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          Bố cục của «{loaiName}»
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Loại đã chọn → chọn style xếp chữ (chữ lớn, đánh số, ảnh, tạp chí…) →
          bộ màu chỉ nhuộm lên khung đó.
        </p>
      </header>

      <section className="space-y-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Style trong loại này
          </p>
          <p className="text-xs text-slate-400">
            {allLayouts.length} bố cục · lọc theo cách xếp chữ
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={layoutStyle === 'all'}
            onClick={() => setLayoutStyle('all')}
            label={`Tất cả style (${allLayouts.length})`}
          />
          {styleOptions.map((id) => {
            const count = layoutsForLoaiStyle(loaiId, id).length
            return (
              <FilterChip
                key={id}
                active={layoutStyle === id}
                onClick={() => setLayoutStyle(id)}
                label={`${LAYOUT_STYLE_LABELS[id]} (${count})`}
              />
            )
          })}
        </div>
      </section>

      {layouts.length === 0 ? (
        <p className="text-sm text-slate-500">
          Loại này chưa có bố cục — sẽ dùng mẫu mặc định.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {layouts.map((layout, index) => {
            const selected = activeLayout?.id === layout.id
            return (
              <motion.button
                key={layout.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.2) }}
                onClick={() =>
                  patchSelection({
                    layoutId: layout.id,
                    selectedBrand: activeBrand,
                  })
                }
                className={cn(
                  'cursor-pointer rounded-2xl border p-3 text-left transition-shadow',
                  selected
                    ? 'border-cyan-400/55 bg-slate-900/80 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                )}
              >
                <div className="relative mb-3">
                  {activeBrand ? (
                    <LayoutPreview layout={layout} brand={activeBrand} />
                  ) : (
                    <div className="aspect-square rounded-lg bg-slate-900" />
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-cyan-500 text-slate-950">
                      <Check className="size-4" aria-hidden />
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-50">{layout.name}</p>
                <p className="mt-0.5 text-[10px] font-medium text-cyan-400/80">
                  {LAYOUT_STYLE_LABELS[styleOf(layout)]}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  {layout.blurb}
                </p>
              </motion.button>
            )
          })}
        </div>
      )}

      <section className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Màu, chữ, logo
            </p>
            <p className="text-xs text-slate-400">
              Đổi bộ màu để xem bố cục đổi theo — chưa phải nội dung thật.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-200 hover:border-slate-500"
          >
            <Plus className="size-3.5" aria-hidden />
            Thêm bộ màu
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={industryFilter === 'all'}
            onClick={() => setIndustryFilter('all')}
            label="Tất cả"
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filtered.map((brand) => {
              const selected = selection.selectedBrand?.id === brand.id
              return (
                <div
                  key={brand.id}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-xl border px-1.5 py-1',
                    selected
                      ? 'border-cyan-400/55 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => patchSelection({ selectedBrand: brand })}
                    className="flex min-h-10 cursor-pointer items-center gap-2 px-1.5 text-left"
                  >
                    <span className="flex -space-x-1" aria-hidden>
                      {[brand.palette.primary, brand.palette.accent, brand.palette.secondary].map(
                        (c) => (
                          <span
                            key={c}
                            className="size-4 rounded-full ring-2 ring-slate-950"
                            style={{ backgroundColor: c }}
                          />
                        )
                      )}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-slate-100">
                        {brand.name}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {brand.typography.heading}
                      </span>
                    </span>
                    {selected && <Check className="size-3.5 text-cyan-300" aria-hidden />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(brand)}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                    aria-label={`Sửa ${brand.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  {brand.custom && (
                    <button
                      type="button"
                      onClick={() => handleDelete(brand)}
                      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                      aria-label={`Xóa ${brand.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {editing && (
          <BrandEditorModal
            brand={editing}
            frame={frame}
            layout={activeLayout}
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
  frame,
  layout,
  onChange,
  onClose,
  onSave,
}: {
  brand: StudioBrand
  frame: PreviewFrame
  layout: StudioLayout | null
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
      aria-label="Chỉnh sửa mẫu"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        className="studio-scrollbar max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">
            {brand.custom ? 'Mẫu tùy chỉnh' : 'Chỉnh sửa mẫu'}
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
          {layout ? (
            <LayoutPreview layout={layout} brand={brand} large />
          ) : (
            <LookPreview brand={brand} frame={frame} />
          )}
          <p className="text-[11px] text-slate-500">
            Đổi màu / font / logo ở dưới — khung bố cục phía trên đổi theo ngay.
          </p>
          <Field label="Tên mẫu *">
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
          <MediaFields
            logo={brand.logoDataUrl}
            photos={brand.photoDataUrls ?? []}
            onLogo={(logoDataUrl) => patch({ logoDataUrl })}
            onPhotos={(photoDataUrls) => patch({ photoDataUrls })}
          />
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
            Lưu mẫu
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
