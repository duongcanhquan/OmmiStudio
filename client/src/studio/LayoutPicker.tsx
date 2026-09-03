import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  LAYOUT_STYLE_LABELS,
  defaultLayoutId,
  layoutById,
  layoutsForLoai,
  layoutsForLoaiStyle,
  styleOf,
  stylesForLoai,
  type LayoutStyle,
} from '../lib/layoutCatalog'
import { cn } from '../lib/utils'
import { useStudio } from './StudioContext'
import { LayoutPreview } from './LayoutPreview'

export function LayoutPicker() {
  const { brands, selection, patchSelection } = useStudio()
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle | 'all'>('all')

  const loaiId = selection.selectedTemplate?.id ?? ''
  const loaiName = selection.selectedTemplate?.name ?? 'sản phẩm đã chọn'
  const previewBrand = selection.selectedBrand ?? brands[0] ?? null
  const allLayouts = layoutsForLoai(loaiId)
  const styleOptions = stylesForLoai(loaiId)
  const layouts = layoutsForLoaiStyle(loaiId, layoutStyle)
  const activeLayout = layoutById(selection.layoutId) ?? layouts[0] ?? null

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

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          Bố cục có sẵn của «{loaiName}»
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Chỉ các khung của loại vừa chọn. Chọn cách xếp chữ — màu và style chọn
          bước sau.
        </p>
      </header>

      {styleOptions.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={layoutStyle === 'all'}
            onClick={() => setLayoutStyle('all')}
            label={`Tất cả (${allLayouts.length})`}
          />
          {styleOptions.map((id) => (
            <FilterChip
              key={id}
              active={layoutStyle === id}
              onClick={() => setLayoutStyle(id)}
              label={`${LAYOUT_STYLE_LABELS[id]} (${layoutsForLoaiStyle(loaiId, id).length})`}
            />
          ))}
        </div>
      )}

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
                onClick={() => patchSelection({ layoutId: layout.id })}
                className={cn(
                  'cursor-pointer rounded-2xl border p-3 text-left transition-shadow',
                  selected
                    ? 'border-cyan-400/55 bg-slate-900/80 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                )}
              >
                <div className="relative mb-3">
                  {previewBrand ? (
                    <LayoutPreview layout={layout} brand={previewBrand} />
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
