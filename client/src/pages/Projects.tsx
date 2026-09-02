import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Clapperboard,
  ExternalLink,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  PlusCircle,
  Presentation,
  Search,
  Trash2,
} from 'lucide-react'
import {
  deleteProject,
  fetchProjects,
  type ProjectKind,
  type ProjectMeta,
} from '../api/projects'
import { isDriveUrl, resolveAssetUrl, type ContentType } from '../api/engine'
import { cn } from '../lib/utils'

interface ProjectsPageProps {
  onNotify?: (message: string, isError?: boolean) => void
  onCreateNew?: () => void
}

type FilterKind = 'all' | ProjectKind
type FilterType = 'all' | ContentType

const TYPE_LABEL: Record<ContentType, string> = {
  video: 'Video',
  slide: 'Slide',
  poster: 'Poster',
}

function TypeIcon({ type }: { type: ContentType }) {
  if (type === 'video') return <Clapperboard className="size-4" aria-hidden />
  if (type === 'poster') return <Image className="size-4" aria-hidden />
  return <Presentation className="size-4" aria-hidden />
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function detectPreviewKind(
  url: string
): 'video' | 'html' | 'drive' | 'unknown' {
  if (isDriveUrl(url) && /drive\.google\.com/i.test(url)) return 'drive'
  const lower = url.toLowerCase().split('?')[0] ?? url
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video'
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html'
  if (/^https?:\/\//i.test(url)) return 'drive'
  return 'unknown'
}

export function ProjectsPage({ onNotify, onCreateNew }: ProjectsPageProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<FilterKind>('all')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<ProjectMeta | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchProjects()
      setProjects(list)
      setSelected((prev) => {
        if (!prev) return list[0] ?? null
        return list.find((p) => p.id === prev.id) ?? list[0] ?? null
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không tải được danh sách dự án'
      onNotify?.(message, true)
    } finally {
      setLoading(false)
    }
  }, [onNotify])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.promptSnippet?.toLowerCase().includes(q) ?? false) ||
        (p.templateId?.toLowerCase().includes(q) ?? false) ||
        (p.brandId?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [projects, query, kindFilter, typeFilter])

  async function handleDelete(project: ProjectMeta) {
    if (
      !window.confirm(
        `Xóa dự án «${project.title}»? Thao tác này xóa luôn workspace trên máy.`
      )
    ) {
      return
    }
    setDeletingId(project.id)
    try {
      await deleteProject(project.workspaceId || project.id)
      onNotify?.('Đã xóa dự án.')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xóa thất bại'
      onNotify?.(message, true)
    } finally {
      setDeletingId(null)
    }
  }

  const previewUrl = selected
    ? resolveAssetUrl(selected.driveUrl || selected.outputUrl)
    : null
  const previewKind = previewUrl ? detectPreviewKind(previewUrl) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-950">
      <div className="border-b border-slate-800/80 px-4 py-3 sm:px-5 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-400/80">
              Thư viện
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
              Dự án của tôi
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Xem trước, mở lại hoặc xóa các bản render / preview đã tạo.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            <PlusCircle className="size-4" aria-hidden />
            Tạo mới
          </button>
        </div>
      </div>

      <div className="studio-scrollbar flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, prompt, brand…"
              className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as FilterKind)}
            className="min-h-11 cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="final">Bản cuối</option>
            <option value="preview">Xem trước</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
            className="min-h-11 cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          >
            <option value="all">Mọi loại</option>
            <option value="video">Video</option>
            <option value="slide">Slide</option>
            <option value="poster">Poster</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Đang tải dự án…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreateNew={onCreateNew} hasAny={projects.length > 0} />
        ) : (
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[340px_1fr]">
            <ul className="space-y-2">
              {filtered.map((p) => {
                const active = selected?.id === p.id
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(p)}
                      className={cn(
                        'w-full cursor-pointer rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-cyan-400/50 bg-cyan-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                      )}
                    >
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-medium text-slate-100">
                          {p.title}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            p.kind === 'final'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-200'
                          )}
                        >
                          {p.kind === 'final' ? 'Final' : 'Preview'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <TypeIcon type={p.type} />
                          {TYPE_LABEL[p.type]}
                        </span>
                        <span>·</span>
                        <span>{formatDate(p.updatedAt || p.createdAt)}</span>
                        {p.uploadedToDrive && (
                          <>
                            <span>·</span>
                            <span className="text-sky-400">Drive</span>
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            {selected && (
              <section className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-slate-50">
                      {selected.title}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {selected.templateId
                        ? `Mẫu: ${selected.templateId}`
                        : 'Không gắn mẫu'}
                      {selected.brandId ? ` · Brand: ${selected.brandId}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-xs font-medium text-slate-200 hover:border-slate-500"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                        Mở
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === selected.id}
                      onClick={() => void handleDelete(selected)}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/30 px-3 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === selected.id ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="size-3.5" aria-hidden />
                      )}
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="relative min-h-[240px] flex-1 bg-slate-900">
                  {previewUrl && previewKind === 'video' && (
                    <video
                      controls
                      src={previewUrl}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  )}
                  {previewUrl && previewKind === 'html' && (
                    <iframe
                      title={selected.title}
                      src={previewUrl}
                      sandbox="allow-scripts allow-same-origin"
                      className="absolute inset-0 h-full w-full border-0 bg-white"
                    />
                  )}
                  {previewUrl && previewKind === 'drive' && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <FolderOpen className="size-8 text-sky-400" aria-hidden />
                      <p className="text-sm text-slate-300">
                        File đã lên Google Drive — mở liên kết để xem.
                      </p>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-slate-950"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                        Mở Drive
                      </a>
                    </div>
                  )}
                  {previewUrl && previewKind === 'unknown' && (
                    <div className="flex h-full items-center justify-center p-6 text-sm text-slate-400">
                      <a
                        href={previewUrl}
                        className="text-cyan-400 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở artifact
                      </a>
                    </div>
                  )}
                </div>

                {selected.promptSnippet && (
                  <div className="border-t border-slate-800 px-4 py-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <FileText className="size-3" aria-hidden />
                      Prompt
                    </p>
                    <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">
                      {selected.promptSnippet}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  onCreateNew,
  hasAny,
}: {
  onCreateNew?: () => void
  hasAny: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
      <FolderOpen className="size-10 text-slate-600" aria-hidden />
      <div>
        <p className="text-base font-medium text-slate-200">
          {hasAny ? 'Không có dự án khớp bộ lọc' : 'Chưa có dự án nào'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {hasAny
            ? 'Thử đổi từ khóa hoặc bộ lọc.'
            : 'Tạo nội dung trong Studio — mỗi lần xem trước hoặc render sẽ xuất hiện ở đây.'}
        </p>
      </div>
      {!hasAny && (
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          <PlusCircle className="size-4" aria-hidden />
          Bắt đầu tạo
        </button>
      )}
    </div>
  )
}

export default ProjectsPage
