import fs from 'fs/promises';
import path from 'path';
import { resolveSkillBind } from '../config/studio-layouts';
import { type SkillCapture } from '../config/studio-skills';
import {
  resolveBrandLook,
  type BrandLook,
  type BrandPaletteInput,
} from './brandLook';
import type { ScriptPart } from './scriptForm';
import { injectBrandMedia, type BrandMedia } from './BrandMediaService';

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
  templateId?: string,
  layoutId?: string
): Promise<string> {
  const bind = resolveSkillBind(templateId, layoutId);
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
  const hideOthers =
    capture === 'first-card' || capture === 'packed-card'
      ? `
  .deck > .card:not(:first-of-type),
  .deck > section:not(:first-of-type),
  .slide:not(:first-of-type),
  .row > .card:not(:first-of-type) { display: none !important; }
  body { padding: 0 !important; }
  .deck { gap: 0 !important; padding: 0 !important; }
  .card, .slide {
    max-width: 100vw !important;
    position: relative !important;
    opacity: 1 !important;
    transform: none !important;
    pointer-events: auto !important;
  }`
      : '';
  const showDeck =
    capture === 'page'
      ? `
  body.single .slide {
    position: relative !important;
    width: 100% !important;
    min-height: 100vh;
    opacity: 1 !important;
    transform: none !important;
    pointer-events: auto !important;
  }`
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
    --brand-primary: ${look.primary};
    --brand-secondary: ${look.secondary};
    --brand-accent: ${look.accent};
    --accent: ${look.accent};
    --accent-2: ${look.secondary};
    --accent-3: ${look.primary};
  }
  ${hideOthers}
  ${showDeck}
  ${print}
</style>`;
  let next = html;
  if (/<body/i.test(next) && !/class="[^"]*\bsingle\b/i.test(next)) {
    next = next.replace(/<body([^>]*)>/i, (_full, attrs: string) => {
      if (/class="/i.test(attrs)) {
        return `<body${attrs.replace(/class="/i, 'class="single ')}>`;
      }
      return `<body class="single"${attrs}>`;
    });
  }
  if (/<\/head>/i.test(next)) {
    return next.replace(/<\/head>/i, `${css}\n</head>`);
  }
  return css + next;
}

function heroMarkup(title: string): string {
  const words = title.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return 'LYON Studio';
  if (words.length === 1) return escapeHtml(words[0]);
  if (words.length === 2) {
    return `${escapeHtml(words[0])}<br/><span style="color:#9c2a25">${escapeHtml(words[1])}</span>`;
  }
  const last = words[words.length - 1] ?? '';
  const rest = words.slice(0, -1);
  const mid = Math.max(1, Math.ceil(rest.length / 2));
  return `${escapeHtml(rest.slice(0, mid).join(' '))}<br/>${escapeHtml(rest.slice(mid).join(' '))}<br/><span style="color:#9c2a25">${escapeHtml(last)}</span>`;
}

function packFirstCard(
  html: string,
  title: string,
  parts: ScriptPart[],
  brand: string
): string {
  const points = parts
    .map((part) => part.title?.trim() || part.body?.trim() || '')
    .filter(Boolean)
    .slice(0, 4);
  const subtitle =
    parts.find((part) => part.body?.trim() && part.body.trim() !== title)
      ?.body ||
    parts[0]?.body ||
    '';
  const cta =
    parts.find((part) => part.role === 'cta')?.title ||
    'Lưu bài · Chia sẻ';
  const icons = [
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#9c2a25" stroke-width="2"><path d="M6 4h12v16l-6-3-6 3z"/></svg>',
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#9c2a25" stroke-width="2"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#9c2a25" stroke-width="2"><path d="M12 3l2.4 6.8H21l-5.4 4.2 2 6.8L12 17.2 6.4 20.8l2-6.8L3 9.8h6.6z"/></svg>',
    '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#9c2a25" stroke-width="2"><path d="M4 6h16v10H7l-3 3V6z"/></svg>',
  ];
  const items = points
    .map(
      (point, index) =>
        `<div style="display:flex;gap:16px;align-items:flex-start;margin:0 0 10px">
          <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.45);display:flex;align-items:center;justify-content:center;flex-shrink:0">${icons[index % icons.length]}</div>
          <div>
            <div class="num" style="font-size:28px;margin:0;line-height:1;opacity:0.55">${String(index + 1).padStart(2, '0')}</div>
            <p class="body" style="margin:6px 0 0;max-width:18ch">${escapeHtml(point)}</p>
          </div>
        </div>`
    )
    .join('');
  const packed = `
    <div class="pageno">01</div>
    <div class="badge">⚡ Nên lưu · Điểm hay</div>
    <div style="display:flex;gap:10px;margin:12px 0 0">${icons
      .slice(0, Math.max(3, points.length || 3))
      .map(
        (icon) =>
          `<span style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.5);display:inline-flex;align-items:center;justify-content:center">${icon}</span>`
      )
      .join('')}</div>
    <div style="margin:auto 0 12px">
      <div style="font-size:22px;font-weight:600;opacity:0.7;margin-bottom:14px">${escapeHtml(brand)}</div>
      <h2 class="hero">${heroMarkup(title)}</h2>
      ${
        subtitle && subtitle !== title
          ? `<p class="body" style="margin:28px 0 0;max-width:22ch">${escapeHtml(subtitle)}</p>`
          : ''
      }
    </div>
    <div style="margin-top:8px">${items}</div>
    <div style="margin-top:auto;display:flex;gap:12px;flex-wrap:wrap;font-size:20px;font-weight:700">
      <span style="padding:10px 22px;background:#9c2a25;color:#fff7f3;border-radius:999px">${escapeHtml(cta)}</span>
    </div>
    <div class="watermark">@${escapeHtml(brand)}</div>`;

  if (/<div class="card c1"/i.test(html) && /<div class="card c2"/i.test(html)) {
    return html.replace(
      /(<div class="card c1"[^>]*>)[\s\S]*?(<div class="card c2")/i,
      `$1${packed}\n  </div>\n\n  $2`
    );
  }
  return html;
}

const SKIP_CLASS = /pageno|watermark|num|badge|meta|ascii|chip|index|lede|caption/i;

function fillRemainingCards(
  html: string,
  title: string,
  parts: ScriptPart[],
  brand: string
): string {
  const slides = [
    { title, body: parts[0]?.body || '' },
    ...parts.map((part) => ({
      title: part.title || title,
      body: part.body || '',
    })),
  ];
  let index = 0;
  let next = html.replace(/<html[^>]*>/i, '<html lang="vi">');
  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(title)} — ${escapeHtml(brand)}</title>`
  );
  next = next.replace(
    /<(h1|h2|h3|p)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag: string, attrs: string, inner: string) => {
      if (index >= slides.length) return full;
      if (/<(svg|img|script|style)/i.test(inner)) return full;
      if (SKIP_CLASS.test(attrs)) return full;
      const plain = inner.replace(/<[^>]+>/g, '').trim();
      if (plain.length < 2 || /^\d+(\s*\/\s*\d+)?$/.test(plain)) return full;
      const slide = slides[index] ?? { title, body: '' };
      const isBody = tag === 'p' || /body/i.test(attrs);
      const value = escapeHtml(
        isBody ? slide.body || slide.title : slide.title
      );
      if (!isBody) index += 1;
      else if (!slide.body) index += 1;
      return `<${tag}${attrs}>${value}</${tag}>`;
    }
  );
  next = next.replace(/@HTMLAnything/g, `@${escapeHtml(brand)}`);
  next = next.replace(
    /(class="(?:logo-name|name)"[^>]*>)([^<]+)/gi,
    `$1${escapeHtml(brand)}`
  );
  const chromeVi: Array<[RegExp, string]> = [
    [/建议收藏\s*·\s*干货预警/g, 'Nên lưu · Điểm hay'],
    [/干货预警/g, 'Điểm hay'],
    [/建议收藏/g, 'Nên lưu'],
    [/滑动看\s*→/g, 'Vuốt xem →'],
    [/滑动看/g, 'Vuốt xem'],
    [/Filebase/g, escapeHtml(brand)],
    [/Halcyon/g, escapeHtml(brand)],
    [/Meridian/g, escapeHtml(brand)],
    [/Jerrod Lew/g, escapeHtml(brand)],
    [/halo\.audio/g, escapeHtml(brand)],
  ];
  for (const [pattern, value] of chromeVi) {
    next = next.replace(pattern, value);
  }
  return next;
}

export function countSkillCards(html: string): number {
  const cards = html.match(/<(?:div|article)[^>]*class="[^"]*\bcard\b/gi);
  if (cards?.length) return cards.length;
  const slides = html.match(/<(?:section|div)[^>]*class="[^"]*\bslide\b/gi);
  return slides?.length ?? 1;
}

export function isolateSkillCard(html: string, index1: number): string {
  const css = `
<style data-lyon-isolate>
  .deck > .card:not(:nth-of-type(${index1})),
  .deck > section:not(:nth-of-type(${index1})),
  .row > .card:not(:nth-of-type(${index1})),
  .slide:not(:nth-of-type(${index1})) { display: none !important; }
  body { padding: 0 !important; }
  .deck { gap: 0 !important; padding: 0 !important; }
  .card, .slide {
    max-width: 100vw !important;
    position: relative !important;
    opacity: 1 !important;
    transform: none !important;
    pointer-events: auto !important;
  }
</style>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${css}\n</head>`);
  }
  return css + html;
}

export async function fillStudioSkillHtml(input: {
  templateId?: string;
  layoutId?: string;
  title: string;
  parts: ScriptPart[];
  brandId?: string;
  prompt?: string;
  palette?: BrandPaletteInput | null;
  media?: BrandMedia | null;
}): Promise<string | null> {
  const bind = resolveSkillBind(input.templateId, input.layoutId);
  if (!bind) return null;
  const examplePath = path.join(SKILLS_DIR, bind.skillId, 'example.html');
  try {
    const raw = await fs.readFile(examplePath, 'utf-8');
    const look = resolveBrandLook({
      brandId: input.brandId,
      prompt: input.prompt,
      palette: input.palette,
    });
    let filled = fillRemainingCards(
      raw,
      input.title,
      input.parts,
      look.name
    );
    if (bind.capture === 'packed-card') {
      filled = packFirstCard(filled, input.title, input.parts, look.name);
    }
    return injectBrandMedia(injectBrand(filled, look, bind.capture), input.media);
  } catch {
    return null;
  }
}
