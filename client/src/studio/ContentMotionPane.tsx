import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bold,
  Eye,
  FileText,
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
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { resolveAssetUrl } from '../api/engine'
import {
  REQUIRED_FIELDS_BY_TYPE,
  TEMPLATE_AI_GUIDANCE,
  TEMPLATE_TYPE_LABELS,
  type RequiredContentField,
  type TemplateType,
} from '../lib/templateTypes'
import { cn } from '../lib/utils'
import { selectionHasContent, useStudio } from './StudioContext'

type ContentTab = 'manual' | 'ai'

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
    goNext,
    canGoNext,
  } = useStudio()

  const [tab, setTab] = useState<ContentTab>(() =>
    selection.richHtml.replace(/<[^>]+>/g, '').trim() && !selection.aiBrief.trim()
      ? 'manual'
      : selection.aiBrief.trim()
        ? 'ai'
        : 'manual'
  )

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
  const hasScriptBody = Boolean(
    selection.richHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  )
  const readyForPublish =
    missingRequired.length === 0 && selectionHasContent(selection)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== selection.richHtml) {
      el.innerHTML = selection.richHtml || ''
    }
  }, [selection.selectedTemplate?.id, tab])

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

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    syncRich()
  }

  function syncRich() {
    patchSelection({ richHtml: editorRef.current?.innerHTML ?? '' })
  }

  function setField(key: string, value: string) {
    patchSelection({
      fieldValues: { ...selection.fieldValues, [key]: value },
    })
  }

  async function handleAi() {
    await runAiAssist()
    setTab('manual')
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">
          Soạn thảo kịch bản
        </h2>
        <p className="text-sm text-slate-400">
          Chọn một hướng: đã có kịch bản thì điền trực tiếp, hoặc để AI viết
          theo yêu cầu + mẫu + thương hiệu — rồi sang xuất bản.
        </p>
      </header>

      {/* Context strip */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Mẫu đang dùng
          </p>
          <p className="mt-0.5 text-sm font-medium text-cyan-200">
            {TEMPLATE_TYPE_LABELS[templateType]}
            {selection.selectedTemplate?.name
              ? ` · ${selection.selectedTemplate.name}`
              : ''}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 px-4 py-3">
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <Palette className="size-3" aria-hidden />
            Thương hiệu
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-100">
            {brand?.name ?? 'Chưa chọn — quay lại bước 2'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Cách soạn kịch bản"
        className="flex gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1"
      >
        <TabButton
          active={tab === 'manual'}
          onClick={() => setTab('manual')}
          icon={FileText}
          title="Đã có kịch bản"
          subtitle="Điền nội dung / thông tin sẵn có"
        />
        <TabButton
          active={tab === 'ai'}
          onClick={() => setTab('ai')}
          icon={Sparkles}
          title="Chưa có — AI viết giúp"
          subtitle="Brief + mẫu + brand → kịch bản"
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-col gap-4 rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 sm:p-5"
          >
            {tab === 'manual' ? (
              <>
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
                  Dán hoặc gõ kịch bản / nội dung đã có. Điền đủ trường bắt buộc
                  của mẫu «{TEMPLATE_TYPE_LABELS[templateType]}», rồi tạo xem
                  trước hoặc sang bước xuất bản.
                </div>

                <RequiredFieldsBlock
                  fields={requiredFields}
                  values={selection.fieldValues}
                  missing={missingRequired.length}
                  onChange={setField}
                />

                <ScriptEditor
                  editorRef={editorRef}
                  onExec={exec}
                  onSync={syncRich}
                  placeholder="Dán kịch bản đầy đủ vào đây: các cảnh, lời thoại, bullet slide…"
                />

                <MotionVoiceRow
                  isVideo={isVideo}
                  selection={selection}
                  patchSelection={patchSelection}
                  grouped={grouped}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      previewLoading ||
                      missingRequired.length > 0 ||
                      !selectionHasContent(selection)
                    }
                    onClick={() => void generatePreview()}
                    className={primaryBtn}
                  >
                    {previewLoading ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                    Tạo xem trước
                  </button>
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={goNext}
                    className={nextBtn}
                  >
                    Sang xuất bản
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
                {!readyForPublish && (
                  <p className="text-xs text-amber-300/90">
                    {missingRequired.length > 0
                      ? `Còn thiếu ${missingRequired.length} trường bắt buộc. `
                      : ''}
                    {!hasScriptBody &&
                      !Object.values(selection.fieldValues).some((v) =>
                        v?.trim()
                      ) &&
                      'Cần nội dung kịch bản hoặc thông tin mẫu.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3 text-xs leading-relaxed text-slate-300">
                  Chưa có kịch bản? Mô tả yêu cầu — AI viết theo tính chất mẫu
                  «{TEMPLATE_TYPE_LABELS[templateType]}»
                  {brand ? ` và giọng brand «${brand.name}»` : ''}. Sau khi AI
                  xong, bạn được chuyển sang tab chỉnh sửa.
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  {TEMPLATE_AI_GUIDANCE[templateType]}
                </p>

                <label className="block space-y-1.5 text-sm">
                  <span className="text-slate-200">
                    Yêu cầu / brief sáng tạo{' '}
                    <span className="text-rose-400">*</span>
                  </span>
                  <textarea
                    rows={5}
                    value={selection.aiBrief}
                    onChange={(e) =>
                      patchSelection({ aiBrief: e.target.value })
                    }
                    placeholder="VD: Video 45s Open Day — hook phụ huynh, 3 lợi ích nổi bật, CTA đăng ký. Giọng ấm, không nói «rẻ»."
                    className={fieldClass}
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="text-slate-200">
                    Cấu trúc mong muốn (tuỳ chọn)
                  </span>
                  <textarea
                    rows={3}
                    value={selection.scriptNotes}
                    onChange={(e) =>
                      patchSelection({ scriptNotes: e.target.value })
                    }
                    placeholder="VD: Hook → 3 lợi ích → CTA · hoặc 5 slide: mở / vấn đề / giải pháp / chứng cứ / kết"
                    className={fieldClass}
                  />
                </label>

                <RequiredFieldsBlock
                  fields={requiredFields}
                  values={selection.fieldValues}
                  missing={missingRequired.length}
                  onChange={setField}
                  title="Thông tin mẫu (AI cần để viết đúng)"
                />

                <MotionVoiceRow
                  isVideo={isVideo}
                  selection={selection}
                  patchSelection={patchSelection}
                  grouped={grouped}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      aiAssistLoading ||
                      briefMissing ||
                      missingRequired.length > 0
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
                    AI viết kịch bản
                  </button>
                  {hasScriptBody && (
                    <button
                      type="button"
                      onClick={() => setTab('manual')}
                      className={nextBtn}
                    >
                      Xem & chỉnh kịch bản
                      <ArrowRight className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
                {(briefMissing || missingRequired.length > 0) && (
                  <p className="text-xs text-amber-300/90">
                    {briefMissing && 'Điền brief yêu cầu. '}
                    {missingRequired.length > 0 &&
                      `Điền đủ ${missingRequired.length} trường mẫu.`}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/70 xl:min-h-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              <Eye className="size-4" aria-hidden />
              Xem trước
            </span>
            {readyForPublish && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Sẵn sàng xuất bản
              </span>
            )}
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
                  {tab === 'ai'
                    ? 'Điền brief → AI viết kịch bản → chỉnh ở tab «Đã có kịch bản» → xem trước → xuất bản.'
                    : 'Điền nội dung → Tạo xem trước → Sang xuất bản.'}
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

function TabButton({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
}: {
  active: boolean
  onClick: () => void
  icon: typeof FileText
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex min-h-14 flex-1 cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors sm:px-4',
        active
          ? 'bg-slate-800 text-slate-50 shadow-sm ring-1 ring-cyan-500/30'
          : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          active ? 'text-cyan-300' : 'text-slate-500'
        )}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
          {subtitle}
        </span>
      </span>
    </button>
  )
}

function RequiredFieldsBlock({
  fields,
  values,
  missing,
  onChange,
  title = 'Thông tin bắt buộc cho mẫu',
}: {
  fields: RequiredContentField[]
  values: Record<string, string>
  missing: number
  onChange: (key: string, value: string) => void
  title?: string
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {missing > 0 ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
            Còn thiếu {missing}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            Đủ tối thiểu
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label
            key={f.key}
            className={cn('space-y-1.5 text-sm', f.multiline && 'sm:col-span-2')}
          >
            <span className="text-slate-300">
              {f.label}
              {f.required && <span className="text-rose-400"> *</span>}
            </span>
            {f.options?.length ? (
              <select
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={fieldClass}
              >
                <option value="">
                  {f.placeholder || '— Chọn —'}
                </option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : f.multiline ? (
              <textarea
                rows={3}
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={fieldClass}
              />
            ) : (
              <input
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={fieldClass}
              />
            )}
            {f.hint && (
              <span className="block text-[11px] text-slate-500">{f.hint}</span>
            )}
          </label>
        ))}
      </div>
    </section>
  )
}

function ScriptEditor({
  editorRef,
  onExec,
  onSync,
  placeholder,
}: {
  editorRef: RefObject<HTMLDivElement | null>
  onExec: (cmd: string, value?: string) => void
  onSync: () => void
  placeholder: string
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Nội dung kịch bản
      </h3>
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
        <ToolBtn label="In đậm" onClick={() => onExec('bold')} icon={Bold} />
        <ToolBtn label="Nghiêng" onClick={() => onExec('italic')} icon={Italic} />
        <ToolBtn
          label="Gạch chân"
          onClick={() => onExec('underline')}
          icon={Underline}
        />
        <span className="mx-1 h-5 w-px bg-slate-700" aria-hidden />
        <ToolBtn
          label="Đầu dòng"
          onClick={() => onExec('insertUnorderedList')}
          icon={List}
        />
        <ToolBtn
          label="Đánh số"
          onClick={() => onExec('insertOrderedList')}
          icon={ListOrdered}
        />
        <ToolBtn
          label="Chèn link"
          onClick={() => {
            const url = window.prompt('Nhập URL liên kết:')
            if (url) onExec('createLink', url)
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
        data-placeholder={placeholder}
        onInput={onSync}
        onBlur={onSync}
        className={cn(
          'min-h-[200px] rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm leading-relaxed text-slate-100 outline-none',
          'focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
          'empty:before:pointer-events-none empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)]'
        )}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </section>
  )
}

function MotionVoiceRow({
  isVideo,
  selection,
  patchSelection,
  grouped,
}: {
  isVideo: boolean
  selection: ReturnType<typeof useStudio>['selection']
  patchSelection: ReturnType<typeof useStudio>['patchSelection']
  grouped: [string, ReturnType<typeof useStudio>['motions']][]
}) {
  const { motions } = useStudio()
  return (
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
      <label className={cn('space-y-1.5 text-sm', !isVideo && 'sm:col-span-2')}>
        <span className="inline-flex items-center gap-1.5 text-slate-300">
          <Wand2 className="size-3.5 text-cyan-400" aria-hidden />
          Hiệu ứng chuyển động
        </span>
        <select
          value={selection.selectedMotion?.id ?? ''}
          onChange={(e) => {
            const next = motions.find((m) => m.id === e.target.value) ?? null
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

const primaryBtn = cn(
  'inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-950',
  'hover:bg-white disabled:cursor-not-allowed disabled:opacity-45'
)

const nextBtn = cn(
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-100',
  'hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45'
)
