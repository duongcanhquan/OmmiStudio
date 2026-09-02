import { motion } from 'framer-motion'
import {
  Bold,
  Eye,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Palette,
  Sparkles,
  Underline,
  Wand2,
} from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { resolveAssetUrl } from '../api/engine'
import {
  REQUIRED_FIELDS_BY_TYPE,
  TEMPLATE_AI_GUIDANCE,
  TEMPLATE_TYPE_LABELS,
  type TemplateType,
} from '../lib/templateTypes'
import { cn } from '../lib/utils'
import { useStudio } from './StudioContext'

export function ContentMotionPane() {
  const {
    selection,
    patchSelection,
    motions,
    previewLoading,
    generatePreview,
    result,
    runAiAssist,
    aiAssistLoading,
  } = useStudio()

  const editorRef = useRef<HTMLDivElement>(null)
  const templateType: TemplateType =
    selection.selectedTemplate?.type ?? 'deck'
  const requiredFields = REQUIRED_FIELDS_BY_TYPE[templateType] ?? []
  const brand = selection.selectedBrand

  const grouped = useMemo(() => {
    const map = new Map<string, typeof motions>()
    for (const m of motions) {
      const list = map.get(m.categoryLabel) ?? []
      list.push(m)
      map.set(m.categoryLabel, list)
    }
    return Array.from(map.entries())
  }, [motions])

  const previewSrc = result.previewUrl
    ? resolveAssetUrl(result.previewUrl)
    : null

  const isVideo = selection.contentType === 'video'

  const missingRequired = requiredFields
    .filter((f) => f.required)
    .filter((f) => !(selection.fieldValues[f.key] ?? '').trim())

  const briefMissing = !selection.aiBrief.trim()

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== selection.richHtml) {
      el.innerHTML = selection.richHtml || ''
    }
  }, [selection.selectedTemplate?.id])

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    syncRich()
  }

  function syncRich() {
    const html = editorRef.current?.innerHTML ?? ''
    patchSelection({ richHtml: html })
  }

  function setField(key: string, value: string) {
    patchSelection({
      fieldValues: { ...selection.fieldValues, [key]: value },
    })
  }

  async function handleAi() {
    await runAiAssist()
  }

  useEffect(() => {
    if (!editorRef.current) return
    if (
      selection.richHtml &&
      editorRef.current.innerHTML !== selection.richHtml &&
      document.activeElement !== editorRef.current
    ) {
      editorRef.current.innerHTML = selection.richHtml
    }
  }, [selection.richHtml])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          Soạn nội dung & kịch bản AI
        </h2>
        <p className="text-sm text-slate-400">
          Brief + thông tin mẫu + brand → AI viết đúng tính chất format và giọng
          thương hiệu.
        </p>
      </header>

      {/* Context: template + brand */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Tính chất mẫu
          </p>
          <p className="mt-1 text-sm font-medium text-cyan-200">
            {TEMPLATE_TYPE_LABELS[templateType]}
            {selection.selectedTemplate?.name
              ? ` · ${selection.selectedTemplate.name}`
              : ''}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {TEMPLATE_AI_GUIDANCE[templateType]}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <Palette className="size-3" aria-hidden />
            Thương hiệu đang áp
          </p>
          {brand ? (
            <>
              <p className="mt-1 text-sm font-medium text-slate-100">
                {brand.name}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tone: {brand.voice.tone}
                {brand.voice.keywords?.length
                  ? ` · ${brand.voice.keywords.slice(0, 4).join(', ')}`
                  : ''}
              </p>
              <div className="mt-2 flex gap-1.5">
                {[
                  brand.palette.primary,
                  brand.palette.secondary,
                  brand.palette.accent,
                ].map((c) => (
                  <span
                    key={c}
                    className="size-5 rounded-md ring-1 ring-white/10"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-amber-300">
              Chưa chọn brand — quay lại bước 2 để AI bám đúng nhận diện.
            </p>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-0 flex-col gap-4 rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 backdrop-blur-md sm:p-5"
        >
          {/* AI Brief — core new section */}
          <section className="space-y-3 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100">
                <Sparkles className="size-4 text-violet-300" aria-hidden />
                Brief & kịch bản cho AI
              </h3>
              {briefMissing ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                  Nên điền brief
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Đã có brief
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Mô tả mục tiêu, đối tượng, thông điệp, điểm cần nhấn — AI sẽ kết
              hợp với mẫu «{TEMPLATE_TYPE_LABELS[templateType]}» và brand
              {brand ? ` «${brand.name}»` : ''}.
            </p>
            <label className="block space-y-1.5 text-sm">
              <span className="text-slate-300">
                Brief sáng tạo <span className="text-rose-400">*</span>
              </span>
              <textarea
                rows={4}
                value={selection.aiBrief}
                onChange={(e) =>
                  patchSelection({ aiBrief: e.target.value })
                }
                placeholder={
                  'VD: Video 45s giới thiệu Open Day — hook cảm xúc phụ huynh, 3 lợi ích nổi bật, CTA đăng ký online. Giọng ấm, không dùng từ «rẻ».'
                }
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-slate-300">
                Cấu trúc / logic kịch bản
              </span>
              <textarea
                rows={3}
                value={selection.scriptNotes}
                onChange={(e) =>
                  patchSelection({ scriptNotes: e.target.value })
                }
                placeholder={
                  'VD: Cảnh 1 hook → Cảnh 2–4 lợi ích → Cảnh 5 CTA. Hoặc: 5 slide: mở đầu / vấn đề / giải pháp / chứng cứ / kết.'
                }
                className={fieldClass}
              />
            </label>
          </section>

          {/* Required fields */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Thông tin bắt buộc cho mẫu
              </h3>
              {missingRequired.length > 0 ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                  Còn thiếu {missingRequired.length} trường
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  Đủ thông tin tối thiểu
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {requiredFields.map((f) => (
                <label
                  key={f.key}
                  className={cn(
                    'space-y-1.5 text-sm',
                    f.multiline && 'sm:col-span-2'
                  )}
                >
                  <span className="text-slate-300">
                    {f.label}
                    {f.required && (
                      <span className="text-rose-400"> *</span>
                    )}
                  </span>
                  {f.multiline ? (
                    <textarea
                      rows={3}
                      value={selection.fieldValues[f.key] ?? ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={fieldClass}
                    />
                  ) : (
                    <input
                      value={selection.fieldValues[f.key] ?? ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={fieldClass}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Rich toolbar — kết quả / chỉnh tay */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kịch bản / nội dung (chỉnh sau khi AI viết)
            </h3>
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              <ToolBtn label="In đậm" onClick={() => exec('bold')} icon={Bold} />
              <ToolBtn
                label="Nghiêng"
                onClick={() => exec('italic')}
                icon={Italic}
              />
              <ToolBtn
                label="Gạch chân"
                onClick={() => exec('underline')}
                icon={Underline}
              />
              <span className="mx-1 h-5 w-px bg-slate-700" aria-hidden />
              <ToolBtn
                label="Đầu dòng"
                onClick={() => exec('insertUnorderedList')}
                icon={List}
              />
              <ToolBtn
                label="Đánh số"
                onClick={() => exec('insertOrderedList')}
                icon={ListOrdered}
              />
              <ToolBtn
                label="Chèn link"
                onClick={() => {
                  const url = window.prompt('Nhập URL liên kết:')
                  if (url) exec('createLink', url)
                }}
                icon={Link2}
              />
            </div>

            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline
              aria-label="Soạn thảo kịch bản"
              data-placeholder="Kịch bản / outline sẽ hiện ở đây sau khi AI viết — hoặc soạn tay…"
              onInput={syncRich}
              onBlur={syncRich}
              className={cn(
                'min-h-[180px] rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none',
                'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                'empty:before:pointer-events-none empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)]'
              )}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {isVideo && (
              <label className="space-y-1.5 text-sm">
                <span className="text-slate-300">Giọng đọc</span>
                <select
                  value={selection.voiceRegion}
                  onChange={(e) =>
                    patchSelection({
                      voiceRegion: e.target.value as 'north' | 'south',
                    })
                  }
                  className={fieldClass}
                >
                  <option value="north">Miền Bắc — Nam Minh</option>
                  <option value="south">Miền Nam — Hoài My</option>
                </select>
              </label>
            )}
            <label
              className={cn('space-y-1.5 text-sm', !isVideo && 'sm:col-span-2')}
            >
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <Wand2 className="size-3.5 text-cyan-400" aria-hidden />
                Hiệu ứng chuyển động
              </span>
              <select
                value={selection.selectedMotion?.id ?? ''}
                onChange={(e) => {
                  const next =
                    motions.find((m) => m.id === e.target.value) ?? null
                  patchSelection({ selectedMotion: next })
                }}
                className={fieldClass}
              >
                <option value="">Tự động (AI chọn)</option>
                {grouped.map(([label, items]) => (
                  <optgroup key={label} label={label}>
                    {items.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                aiAssistLoading ||
                missingRequired.length > 0 ||
                briefMissing
              }
              onClick={() => void handleAi()}
              className={cn(
                'inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 text-sm font-semibold text-violet-100',
                'hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-45'
              )}
            >
              {aiAssistLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              AI viết theo brief
            </button>
            <button
              type="button"
              disabled={
                previewLoading ||
                missingRequired.length > 0 ||
                (!selection.aiBrief.trim() &&
                  !selection.prompt.trim() &&
                  !Object.values(selection.fieldValues).some((v) => v.trim()) &&
                  !selection.richHtml.replace(/<[^>]+>/g, '').trim())
              }
              onClick={() => void generatePreview()}
              className={cn(
                'inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-950',
                'hover:bg-white disabled:cursor-not-allowed disabled:opacity-45'
              )}
            >
              {previewLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
              Tạo xem trước
            </button>
          </div>
          {(briefMissing || missingRequired.length > 0) && (
            <p className="text-xs text-amber-300/90">
              {briefMissing && 'Điền brief sáng tạo. '}
              {missingRequired.length > 0 &&
                `Điền đủ ${missingRequired.length} trường bắt buộc của mẫu.`}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/70 backdrop-blur-md xl:min-h-0"
        >
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
            <Eye className="size-4 text-slate-400" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Xem trước toàn màn
            </span>
          </div>
          <div className="relative min-h-0 flex-1 bg-slate-900">
            {previewSrc ? (
              <iframe
                title="Xem trước OmniStudio"
                src={previewSrc}
                sandbox="allow-scripts allow-same-origin"
                className="absolute inset-0 h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-2 p-6 text-center">
                <Eye className="size-7 text-slate-600" aria-hidden />
                <p className="max-w-xs text-sm text-slate-400">
                  Điền brief + trường mẫu → AI viết kịch bản → Tạo xem trước.
                </p>
              </div>
            )}
            {(previewLoading || aiAssistLoading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
                <Loader2
                  className="size-8 animate-spin text-cyan-400"
                  aria-hidden
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ToolBtn({
  label,
  onClick,
  icon: Icon,
}: {
  label: string
  onClick: () => void
  icon: typeof Bold
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  )
}

const fieldClass = cn(
  'min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100',
  'placeholder:text-slate-500',
  'focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'
)
