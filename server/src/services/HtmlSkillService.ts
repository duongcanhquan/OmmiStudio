import fs from 'fs/promises';
import path from 'path';
import { skillBindFor, type SkillCapture } from '../config/studio-skills';
import {
  resolveBrandLook,
  type BrandLook,
  type BrandPaletteInput,
} from './brandLook';
import type { ScriptPart } from './scriptForm';

const SKILLS_DIR = path.resolve(
  __dirname,
  '../../tools/html-anything/next/src/lib/templates/skills'
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function readSkillBrief(skillId: string): Promise<string> {
  const skillPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');
  try {
    const raw = await fs.readFile(skillPath, 'utf-8');
    const body = raw.replace(/^---[\s\S]*?---\s*/, '').trim();
    return body.slice(0, 1800);
  } catch {
    return '';
  }
}

export async function skillBriefForTemplate(
  templateId?: string
): Promise<string> {
  const bind = skillBindFor(templateId);
  if (!bind) return '';
  const brief = await readSkillBrief(bind.skillId);
  if (!brief) return '';
  return [
    `Mẫu thiết kế html-anything «${bind.skillId}».`,
    `Dành cho: ${bind.purpose}. File xuất: ${bind.fileLabel}.`,
    bind.copyHint,
    'Viết chữ khớp bố cục skill (tiêu đề lớn, ít chữ, đúng số khung).',
    brief,
  ].join('\n');
}

function injectBrand(
  html: string,
  look: BrandLook,
  capture: SkillCapture
): string {
  const firstCard =
    capture === 'first-card'
      ? `
  .deck > .card:not(:first-of-type) { display: none !important; }
  body { padding: 0 !important; background: ${look.surface} !important; }
  .deck { gap: 0 !important; padding: 0 !important; }
  .card { max-width: 100vw !important; box-shadow: none !important; }`
      : '';
  const print =
    capture === 'print'
      ? `
  @page { size: A4; margin: 10mm; }
  @media print {
    body { background: #fff !important; padding: 0 !important; }
    .page, .card, .sheet { box-shadow: none !important; margin: 0 !important; }
  }`
      : '';
  const css = `
<style data-lyon-brand>
  :root {
    --accent: ${look.primary} !important;
    --ink: ${look.ink} !important;
    --paper: ${look.surface} !important;
    --muted: ${look.muted} !important;
    --tint: ${look.secondary}22 !important;
    --rule: ${look.primary}33 !important;
    --brand-primary: ${look.primary};
    --brand-secondary: ${look.secondary};
    --brand-accent: ${look.accent};
  }
  html, body { font-family: "Be Vietnam Pro", "Noto Sans", "Arial Unicode MS", sans-serif !important; }
  ${firstCard}
  ${print}
</style>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${css}\n</head>`);
  }
  return css + html;
}

const SKIP_CLASS = /pageno|watermark|num|badge|meta|logo/i;

function fillCopy(
  html: string,
  title: string,
  parts: ScriptPart[],
  brand: string
): string {
  const texts = [
    title,
    ...parts.flatMap((part) =>
      [part.title, part.body].filter((value) => Boolean(value?.trim()))
    ),
  ];
  let index = 0;
  let next = html.replace(/<html[^>]*>/i, '<html lang="vi">');
  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)} — ${escapeHtml(brand)}</title>`
  );
  next = next.replace(
    /<(h1|h2|h3|p|li)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag: string, attrs: string, inner: string) => {
      if (index >= texts.length) return full;
      if (/<(svg|img|script|style)/i.test(inner)) return full;
      if (SKIP_CLASS.test(attrs)) return full;
      const plain = inner.replace(/<[^>]+>/g, '').trim();
      if (plain.length < 2 || /^\d+(\s*\/\s*\d+)?$/.test(plain)) return full;
      const value = escapeHtml(texts[index] ?? '');
      index += 1;
      return `<${tag}${attrs}>${value}</${tag}>`;
    }
  );
  next = next.replace(/@HTMLAnything/g, escapeHtml(brand));
  next = next.replace(/HTML Anything/gi, escapeHtml(brand));
  next = next.replace(/html-anything/gi, escapeHtml(brand));
  const chromeVi: Array<[RegExp, string]> = [
    [/建议收藏\s*·\s*干货预警/g, 'Nên lưu · Điểm hay'],
    [/干货预警/g, 'Điểm hay'],
    [/建议收藏/g, 'Nên lưu'],
    [/AI 工具党\s*·\s*必看/g, escapeHtml(brand)],
    [/滑动看\s*→/g, 'Vuốt xem →'],
    [/滑动看/g, 'Vuốt xem'],
    [/必看/g, 'Đáng đọc'],
  ];
  for (const [pattern, value] of chromeVi) {
    next = next.replace(pattern, value);
  }
  return next;
}

export async function fillStudioSkillHtml(input: {
  templateId?: string;
  title: string;
  parts: ScriptPart[];
  brandId?: string;
  prompt?: string;
  palette?: BrandPaletteInput | null;
}): Promise<string | null> {
  const bind = skillBindFor(input.templateId);
  if (!bind) return null;
  const examplePath = path.join(SKILLS_DIR, bind.skillId, 'example.html');
  try {
    const raw = await fs.readFile(examplePath, 'utf-8');
    const look = resolveBrandLook({
      brandId: input.brandId,
      prompt: input.prompt,
      palette: input.palette,
    });
    return injectBrand(
      fillCopy(raw, input.title, input.parts, look.name),
      look,
      bind.capture
    );
  } catch {
    return null;
  }
}
