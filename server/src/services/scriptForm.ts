import { toScreenCopy } from './kineticCopy';
import type { VideoScript } from './LLMService';

export type ScriptPartRole =
  | 'hook'
  | 'body'
  | 'cta'
  | 'slide'
  | 'section'
  | 'item';

export interface ScriptPart {
  id: string;
  role: ScriptPartRole;
  title: string;
  body: string;
  notes?: string;
}

export type StudioTemplateType =
  | 'deck'
  | 'poster'
  | 'video'
  | 'social'
  | 'document'
  | 'landing'
  | 'newsletter'
  | 'infographic'
  | 'certificate'
  | 'resume'
  | 'brochure'
  | 'event'
  | 'worksheet'
  | 'quiz';

export type ExportKind = 'video' | 'html' | 'pdf' | 'image';

const PRINT_TYPES = new Set<StudioTemplateType>([
  'document',
  'newsletter',
  'resume',
  'brochure',
  'event',
  'worksheet',
  'quiz',
]);

export function exportKindForType(
  type?: string,
  fieldValues?: Record<string, string>
): ExportKind {
  const t = (type || '') as StudioTemplateType;
  if (t === 'video') return 'video';
  if (t === 'social') {
    return fieldValues?.outputFormat === 'video' ? 'video' : 'image';
  }
  if (PRINT_TYPES.has(t)) return 'pdf';
  return 'html';
}

export function parseParts(raw: unknown): ScriptPart[] {
  if (!Array.isArray(raw)) return [];
  const parts: ScriptPart[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const title = String(rec.title ?? '').trim();
    const body = String(rec.body ?? '').trim();
    const notes = String(rec.notes ?? '').trim();
    if (!title && !body && !notes) continue;
    const roleRaw = String(rec.role ?? 'body');
    const role: ScriptPartRole = [
      'hook',
      'body',
      'cta',
      'slide',
      'section',
      'item',
    ].includes(roleRaw)
      ? (roleRaw as ScriptPartRole)
      : 'body';
    parts.push({
      id: String(rec.id ?? `part-${index + 1}`),
      role,
      title,
      body,
      notes: notes || undefined,
    });
  }
  return parts;
}

export function partsToVideoScript(
  title: string,
  parts: ScriptPart[],
  durationHint?: number
): VideoScript {
  const usable = parts.filter(
    (part) => part.title || part.body || part.notes
  );
  const per =
    usable.length > 0 && durationHint && durationHint > 0
      ? Math.min(8, Math.max(4, Math.round(durationHint / usable.length)))
      : 5;
  const motions = ['fade-in', 'slide-up', 'zoom-in', 'ken-burns'];
  return {
    title: title || usable[0]?.title || 'LYON Studio',
    language: 'vi',
    scenes: usable.map((part, index) => {
      const spoken = (part.notes || part.body || part.title).slice(0, 280);
      return {
        sceneId: index + 1,
        visualText: toScreenCopy(part.title || part.body, title || 'LYON Studio'),
        voiceoverText: spoken,
        motionType: motions[index % motions.length],
        duration: per,
      };
    }),
  };
}

export function assertNormalizedForm(data: unknown): {
  title: string;
  fieldValues: Record<string, string>;
  parts: ScriptPart[];
} {
  if (!data || typeof data !== 'object') {
    throw new Error('AI không trả về form JSON.');
  }
  const rec = data as Record<string, unknown>;
  const fieldValues =
    rec.fieldValues && typeof rec.fieldValues === 'object'
      ? Object.fromEntries(
          Object.entries(rec.fieldValues as Record<string, unknown>).map(
            ([key, value]) => [key, String(value ?? '')]
          )
        )
      : {};
  const title = String(rec.title ?? fieldValues.title ?? '').trim();
  if (title && !fieldValues.title) fieldValues.title = title;
  const parts = parseParts(rec.parts);
  if (!fieldValues.title && !parts.length) {
    throw new Error('AI chưa điền tiêu đề hoặc các phần form.');
  }
  return { title: fieldValues.title || title, fieldValues, parts };
}
