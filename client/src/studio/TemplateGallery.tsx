import { AnimatePresence, motion } from 'framer-motion'
import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TemplateMeta } from '../api/engine'
import {
  TEMPLATE_CATEGORY_GROUPS,
  TEMPLATE_TYPE_ICONS,
  TEMPLATE_TYPE_LABELS,
  templateTypeToContentType,
  type TemplateFilter,
  type TemplateType,
} from '../lib/templateTypes'
import { cn } from '../lib/utils'
import { useStudio } from './StudioContext'

const GRADIENTS = [
  'from-sky-600/50 to-slate-950',
  'from-violet-600/45 to-slate-950',
  'from-emerald-600/45 to-slate-950',
  'from-rose-600/45 to-slate-950',
  'from-amber-500/40 to-slate-950',
  'from-cyan-600/45 to-slate-950',
]

export function TemplateGallery() {
  const {
    templates,
    assetsLoading,
    templateFilter,
    setTemplateFilter,
    selection,
    patchSelection,
  } = useStudio()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      const typeOk =
        templateFilter === 'all' ? true : t.type === templateFilter
      if (!typeOk) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        TEMPLATE_TYPE_LABELS[t.type]?.toLowerCase().includes(q)
      )
    })
  }, [templates, templateFilter, query])

  const counts = useMemo(() => {
    const map: Partial<Record<TemplateFilter, number>> = { all: templates.length }
    for (const t of templates) {
      map[t.type] = (map[t.type] ?? 0) + 1
    }
    return map
  }, [templates])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-50">
            Chọn mẫu thiết kế
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Tìm theo tên hoặc lọc theo nhóm ngành — lưới icon gọn, dễ nhận biết.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm mẫu: quiz, poster, orientation…"
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Category rail — dọc, không kéo ngang */}
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
          {TEMPLATE_CATEGORY_GROUPS.map((group) => (
            <div key={group.id} className="mb-3 last:mb-0">
              <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.types.map((typeId) => {
                  const active = templateFilter === typeId
                  const Icon =
                    typeId === 'all'
                      ? TEMPLATE_TYPE_ICONS.deck
                      : TEMPLATE_TYPE_ICONS[typeId as TemplateType]
                  const label =
                    typeId === 'all'
                      ? 'Tất cả'
                      : TEMPLATE_TYPE_LABELS[typeId as TemplateType]
                  return (
                    <li key={typeId}>
                      <button
                        type="button"
                        onClick={() => setTemplateFilter(typeId)}
                        className={cn(
                          'flex w-full min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors',
                          active
                            ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/35'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        )}
                      >
                        <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                        <span className="flex-1 truncate">{label}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {counts[typeId] ?? 0}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </aside>

        <div>
          {assetsLoading ? (
            <p className="text-sm text-slate-500">Đang quét mẫu…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
              Không tìm thấy mẫu phù hợp. Thử từ khóa khác hoặc chọn «Tất cả».
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((tpl, index) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    index={index}
                    selected={selection.selectedTemplate?.id === tpl.id}
                    onSelect={() =>
                      patchSelection({
                        selectedTemplate: tpl,
                        contentType: templateTypeToContentType(tpl.type),
                        fieldValues: {},
                      })
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  index,
  selected,
  onSelect,
}: {
  template: TemplateMeta
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const Icon = TEMPLATE_TYPE_ICONS[template.type] ?? TEMPLATE_TYPE_ICONS.deck
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.15) }}
      onClick={onSelect}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border text-left transition-shadow',
        selected
          ? 'border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_0_20px_rgba(34,211,238,0.12)]'
          : 'border-slate-800 hover:border-slate-600'
      )}
    >
      <div
        className={cn(
          'relative flex aspect-[5/3] items-center justify-center bg-gradient-to-br',
          gradient
        )}
      >
        <Icon
          className="size-8 text-white/35 transition-transform duration-200 group-hover:scale-110 group-hover:text-white/55"
          aria-hidden
        />
        <span className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-200 backdrop-blur">
          {TEMPLATE_TYPE_LABELS[template.type]}
        </span>
        {selected && (
          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
            <Check className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
      <div className="space-y-0.5 px-2.5 py-2.5">
        <p className="truncate text-sm font-medium text-slate-100">
          {template.name}
        </p>
        <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">
          {template.description || 'Chọn để dùng mẫu này'}
        </p>
      </div>
    </motion.button>
  )
}
