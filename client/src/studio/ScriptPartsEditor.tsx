import { Minus, Plus } from 'lucide-react'
import {
  defaultRoleForType,
  maxPartsForType,
  metaFieldsForType,
  newPart,
  partLabel,
  type ScriptPart,
} from '../lib/scriptForm'
import type { TemplateType } from '../lib/templateTypes'
import { cn } from '../lib/utils'

const fieldClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none'

export function ScriptPartsEditor({
  type,
  fieldValues,
  parts,
  onField,
  onParts,
}: {
  type: TemplateType
  fieldValues: Record<string, string>
  parts: ScriptPart[]
  onField: (key: string, value: string) => void
  onParts: (parts: ScriptPart[]) => void
}) {
  const meta = metaFieldsForType(type)
  const max = maxPartsForType(type)
  const showNotes = type === 'video' || type === 'social'

  function patchPart(id: string, patch: Partial<ScriptPart>) {
    onParts(parts.map((part) => (part.id === id ? { ...part, ...patch } : part)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {meta.map((field) => (
          <label key={field.key} className="block space-y-1.5 text-sm">
            <span className="text-slate-200">
              {field.label}
              {field.key === 'title' ? (
                <span className="text-rose-400"> *</span>
              ) : null}
            </span>
            {field.options ? (
              <select
                value={fieldValues[field.key] ?? field.options[0]?.value ?? ''}
                onChange={(e) => onField(field.key, e.target.value)}
                className={fieldClass}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={fieldValues[field.key] ?? ''}
                onChange={(e) => onField(field.key, e.target.value)}
                className={fieldClass}
                placeholder={field.label}
              />
            )}
          </label>
        ))}
      </div>

      <div className="space-y-3">
        {parts.map((part, index) => (
          <article
            key={part.id}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/90">
                {partLabel(type, part, index)}
              </p>
              {parts.length > 1 && (
                <button
                  type="button"
                  onClick={() => onParts(parts.filter((p) => p.id !== part.id))}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-900 hover:text-rose-200"
                >
                  <Minus className="size-3" aria-hidden />
                  Xóa
                </button>
              )}
            </div>
            <input
              value={part.title}
              onChange={(e) => patchPart(part.id, { title: e.target.value })}
              className={cn(fieldClass, 'mb-2')}
              placeholder="Tiêu đề phần"
            />
            <textarea
              rows={3}
              value={part.body}
              onChange={(e) => patchPart(part.id, { body: e.target.value })}
              className={fieldClass}
              placeholder="Nội dung ngắn — đúng một phần"
            />
            {showNotes && (
              <textarea
                rows={2}
                value={part.notes ?? ''}
                onChange={(e) => patchPart(part.id, { notes: e.target.value })}
                className={cn(fieldClass, 'mt-2')}
                placeholder="Lời đọc (không bắt buộc)"
              />
            )}
          </article>
        ))}
      </div>

      {parts.length < max && (
        <button
          type="button"
          onClick={() =>
            onParts([
              ...parts,
              {
                ...newPart(type, parts.length),
                role:
                  parts[parts.length - 1]?.role === 'cta'
                    ? defaultRoleForType(type)
                    : newPart(type, parts.length).role,
              },
            ])
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-800 px-3 text-sm text-slate-200 hover:border-cyan-500/40"
        >
          <Plus className="size-4" aria-hidden />
          Thêm phần
        </button>
      )}
    </div>
  )
}
