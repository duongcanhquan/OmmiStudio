import { AnimatePresence, motion } from 'framer-motion'
import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TemplateMeta } from '../api/engine'
import { defaultLayoutId } from '../lib/layoutCatalog'
import {
  catalogById,
  defaultsForCatalog,
  type OutputFormat,
  type StudioCatalogItem,
} from '../lib/templateCatalog'
import {
  TEMPLATE_CATEGORY_GROUPS,
  TEMPLATE_FORMAT_NOTE,
  TEMPLATE_TYPE_LABELS,
  templateTypeToContentType,
  type TemplateFilter,
  type TemplateType,
} from '../lib/templateTypes'
import { cn } from '../lib/utils'
import { useStudio } from './StudioContext'

const FILTER_MARK: Record<string, string> = {
  all: 'ALL',
  social: 'PNG',
  video: 'MP4',
  poster: 'PST',
  deck: 'SLD',
  infographic: 'ĐH',
  landing: 'WEB',
  certificate: 'GIẤY',
  document: 'PDF',
  newsletter: 'TIN',
  brochure: 'TỜ',
  event: 'SK',
  resume: 'CV',
  worksheet: 'PHIẾU',
  quiz: 'QUIZ',
}

const BADGE_TONE: Record<OutputFormat, string> = {
  image: 'bg-rose-500 text-white',
  video: 'bg-amber-400 text-slate-950',
  html: 'bg-sky-400 text-slate-950',
  pdf: 'bg-emerald-400 text-slate-950',
}

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
      const extra = catalogById(t.id)
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        TEMPLATE_TYPE_LABELS[t.type]?.toLowerCase().includes(q) ||
        (extra?.outputLabel.toLowerCase().includes(q) ?? false) ||
        (extra?.purpose.toLowerCase().includes(q) ?? false) ||
        (extra?.skillId.toLowerCase().includes(q) ?? false)
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
            Chọn loại sản phẩm
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {templateFilter === 'social'
              ? TEMPLATE_FORMAT_NOTE.social
              : templateFilter === 'video'
                ? TEMPLATE_FORMAT_NOTE.video
                : 'Bước này chọn loại file (ảnh, video, slide, PDF). Bước sau chọn mẫu — xem trước màu và chữ trên đúng khổ đó.'}
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
            placeholder="Tìm: ảnh vuông, video dọc, CV…"
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
          {TEMPLATE_CATEGORY_GROUPS.map((group) => (
            <div key={group.id} className="mb-3 last:mb-0">
              <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.types.map((typeId) => {
                  const active = templateFilter === typeId
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
                          'flex w-full min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors',
                          active
                            ? 'bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/35'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        )}
                      >
                        <span className="w-9 shrink-0 text-center font-mono text-[10px] font-bold tracking-tight text-slate-300">
                          {FILTER_MARK[typeId] ?? '·'}
                        </span>
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
            <p className="text-sm text-slate-500">Đang tải mẫu…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
              Không tìm thấy mẫu phù hợp. Thử từ khóa khác hoặc chọn «Tất cả».
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((tpl, index) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    index={index}
                    selected={selection.selectedTemplate?.id === tpl.id}
                    onSelect={() => {
                      const seeded = defaultsForCatalog(tpl)
                      patchSelection({
                        selectedTemplate: tpl,
                        layoutId: defaultLayoutId(tpl.id),
                        contentType: templateTypeToContentType(
                          tpl.type,
                          seeded.fieldValues
                        ),
                        fieldValues: seeded.fieldValues,
                        parts: seeded.parts,
                      })
                    }}
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
  const item: StudioCatalogItem = catalogById(template.id) ?? {
    ...template,
    output: template.type === 'video' ? 'video' : 'html',
    outputLabel: template.type === 'video' ? 'VIDEO MP4' : 'FILE',
    purpose: template.description || 'Sản phẩm Studio',
    skillId: '',
    frame: 'landscape',
    accent: '#334155',
    accent2: '#64748b',
  }

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
        'group relative grid h-[15.5rem] cursor-pointer grid-rows-2 overflow-hidden rounded-xl border text-left transition-shadow sm:h-[16.5rem]',
        selected
          ? 'border-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_12px_32px_rgba(0,0,0,0.35)]'
          : 'border-slate-800 hover:border-slate-500'
      )}
    >
      <div className="relative min-h-0 overflow-hidden">
        <ProductThumb item={item} />
        <span
          className={cn(
            'absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide',
            BADGE_TONE[item.output]
          )}
        >
          {item.outputLabel}
        </span>
        {selected && (
          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
            <Check className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-col justify-center gap-1.5 border-t border-slate-800/80 bg-slate-950/80 px-3 py-2.5">
        <p className="text-[15px] font-semibold leading-snug text-slate-50 sm:text-base">
          {template.name}
        </p>
        <p className="text-[12px] leading-relaxed text-slate-400 sm:text-[13px]">
          {item.purpose}
        </p>
      </div>
    </motion.button>
  )
}

function ProductThumb({ item }: { item: StudioCatalogItem }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(155deg, ${item.accent} 0%, #0b1220 68%)`,
      }}
    >
      <span
        className="flex size-[4.75rem] items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-[2px] sm:size-[5.25rem]"
        aria-hidden
      >
        <ThumbArt id={item.id} ink="#f8fafc" accent={item.accent2} />
      </span>
    </div>
  )
}

/** Minh họa loại sản phẩm — không dùng icon Lucide chung chung. */
function ThumbArt({
  id,
  ink,
  accent,
}: {
  id: string
  ink: string
  accent: string
}) {
  const common = {
    width: 72,
    height: 72,
    viewBox: '0 0 56 56',
    fill: 'none',
    'aria-hidden': true as const,
  }

  if (id === 'social-vuong') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="40" height="40" rx="8" fill={ink} />
        <path d="M8 36l10-9 8 7 7-11 15 16H8z" fill={accent} />
        <circle cx="38" cy="18" r="4" fill={accent} />
      </svg>
    )
  }
  if (id === 'social-story') {
    return (
      <svg {...common}>
        <rect x="16" y="4" width="24" height="48" rx="6" fill={ink} />
        <rect x="19" y="10" width="18" height="30" rx="2" fill={accent} />
        <circle cx="28" cy="46" r="2" fill={accent} />
      </svg>
    )
  }
  if (id === 'social-carousel') {
    return (
      <svg {...common}>
        <rect x="18" y="10" width="28" height="28" rx="4" fill={ink} opacity=".35" transform="rotate(12 32 24)" />
        <rect x="14" y="12" width="28" height="28" rx="4" fill={ink} opacity=".6" transform="rotate(6 28 26)" />
        <rect x="10" y="14" width="28" height="28" rx="4" fill={ink} />
        <rect x="14" y="18" width="20" height="12" rx="2" fill={accent} />
      </svg>
    )
  }
  if (id === 'video-ngang') {
    return (
      <svg {...common}>
        <rect x="4" y="14" width="48" height="28" rx="5" fill={ink} />
        <path d="M24 22v12l12-6-12-6z" fill={accent} />
      </svg>
    )
  }
  if (id === 'video-doc') {
    return (
      <svg {...common}>
        <rect x="16" y="4" width="24" height="48" rx="6" fill={ink} />
        <path d="M24 22v12l12-6-12-6z" fill={accent} />
      </svg>
    )
  }
  if (id === 'poster-mot-mat') {
    return (
      <svg {...common}>
        <rect x="14" y="4" width="28" height="48" rx="3" fill={ink} />
        <rect x="18" y="8" width="20" height="14" rx="1" fill={accent} />
        <rect x="18" y="26" width="16" height="3" fill="#0f172a" opacity=".35" />
        <rect x="18" y="32" width="20" height="2" fill="#0f172a" opacity=".25" />
        <rect x="18" y="37" width="14" height="2" fill="#0f172a" opacity=".2" />
      </svg>
    )
  }
  if (id === 'deck-chuan') {
    return (
      <svg {...common}>
        <rect x="10" y="18" width="36" height="22" rx="2" fill={ink} opacity=".4" />
        <rect x="8" y="14" width="36" height="22" rx="2" fill={ink} />
        <rect x="12" y="18" width="14" height="3" fill={accent} />
        <rect x="12" y="24" width="28" height="2" fill="#0f172a" opacity=".25" />
        <rect x="12" y="28" width="22" height="2" fill="#0f172a" opacity=".2" />
      </svg>
    )
  }
  if (id === 'infographic-so-lieu') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="40" height="40" rx="4" fill={ink} />
        <rect x="14" y="30" width="7" height="10" fill={accent} />
        <rect x="24" y="20" width="7" height="20" fill={accent} />
        <rect x="34" y="14" width="7" height="26" fill={accent} />
      </svg>
    )
  }
  if (id === 'document-a4' || id === 'resume-cv') {
    return (
      <svg {...common}>
        <path d="M16 6h18l8 8v34H16V6z" fill={ink} />
        <path d="M34 6v8h8" fill={accent} />
        <rect x="20" y="20" width="16" height="2.5" fill="#0f172a" opacity=".35" />
        <rect x="20" y="26" width="20" height="2" fill="#0f172a" opacity=".22" />
        <rect x="20" y="31" width="18" height="2" fill="#0f172a" opacity=".18" />
        <rect x="20" y="36" width="12" height="2" fill="#0f172a" opacity=".15" />
      </svg>
    )
  }
  if (id === 'newsletter-email') {
    return (
      <svg {...common}>
        <rect x="6" y="14" width="44" height="28" rx="4" fill={ink} />
        <path d="M8 16l20 14L48 16" stroke={accent} strokeWidth="2.4" />
      </svg>
    )
  }
  if (id === 'landing-dich') {
    return (
      <svg {...common}>
        <rect x="4" y="10" width="48" height="36" rx="4" fill={ink} />
        <rect x="4" y="10" width="48" height="8" rx="4" fill={accent} />
        <circle cx="10" cy="14" r="1.4" fill={ink} />
        <circle cx="15" cy="14" r="1.4" fill={ink} />
        <rect x="10" y="24" width="22" height="4" fill="#0f172a" opacity=".35" />
        <rect x="10" y="31" width="16" height="3" fill={accent} />
      </svg>
    )
  }
  if (id === 'brochure-to-roi') {
    return (
      <svg {...common}>
        <path d="M8 12h18v32H8z" fill={ink} />
        <path d="M26 12h22v32H26z" fill={accent} />
        <rect x="12" y="18" width="10" height="3" fill="#0f172a" opacity=".3" />
        <rect x="30" y="18" width="14" height="3" fill="#0f172a" opacity=".25" />
      </svg>
    )
  }
  if (id === 'event-su-kien') {
    return (
      <svg {...common}>
        <rect x="8" y="12" width="40" height="36" rx="4" fill={ink} />
        <rect x="8" y="12" width="40" height="10" fill={accent} />
        <rect x="16" y="8" width="3" height="8" rx="1" fill={ink} />
        <rect x="37" y="8" width="3" height="8" rx="1" fill={ink} />
        <rect x="14" y="28" width="6" height="6" rx="1" fill={accent} />
        <rect x="25" y="28" width="6" height="6" rx="1" fill="#0f172a" opacity=".2" />
        <rect x="36" y="28" width="6" height="6" rx="1" fill="#0f172a" opacity=".2" />
      </svg>
    )
  }
  if (id === 'certificate-giay') {
    return (
      <svg {...common}>
        <rect x="4" y="14" width="48" height="28" rx="3" fill={ink} />
        <rect x="8" y="18" width="28" height="4" fill={accent} />
        <circle cx="44" cy="32" r="6" fill={accent} />
        <rect x="8" y="26" width="22" height="2" fill="#0f172a" opacity=".2" />
      </svg>
    )
  }
  if (id === 'worksheet-phieu') {
    return (
      <svg {...common}>
        <rect x="10" y="6" width="36" height="44" rx="3" fill={ink} />
        <rect x="14" y="14" width="8" height="8" rx="1" stroke={accent} strokeWidth="2" />
        <rect x="26" y="16" width="16" height="3" fill="#0f172a" opacity=".3" />
        <rect x="14" y="28" width="8" height="8" rx="1" stroke={accent} strokeWidth="2" />
        <rect x="26" y="30" width="16" height="3" fill="#0f172a" opacity=".3" />
      </svg>
    )
  }
  if (id === 'quiz-cau-hoi') {
    return (
      <svg {...common}>
        <rect x="10" y="6" width="36" height="44" rx="3" fill={ink} />
        <circle cx="18" cy="18" r="5" fill={accent} />
        <text x="18" y="21" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f172a">
          1
        </text>
        <rect x="26" y="16" width="14" height="3" fill="#0f172a" opacity=".3" />
        <circle cx="18" cy="34" r="5" fill={accent} />
        <text x="18" y="37" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f172a">
          2
        </text>
        <rect x="26" y="32" width="14" height="3" fill="#0f172a" opacity=".3" />
      </svg>
    )
  }

  return (
    <span className="text-[28px] font-black leading-none text-white">
      {id.slice(0, 3).toUpperCase()}
    </span>
  )
}
