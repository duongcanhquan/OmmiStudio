import fs from 'fs/promises';
import path from 'path';
import { skillBindFor } from '../config/studio-skills';
import { injectVietnameseFonts } from '../config/brand-assets';
import {
  resolveBrandLook,
  type BrandLook,
  type BrandPaletteInput,
} from './brandLook';
import { injectMotionRecipe } from './MotionRecipeService';
import { injectBrandMedia, type BrandMedia } from './BrandMediaService';
import type { ScriptPart } from './scriptForm';

const TEMPLATES_DIR = path.resolve(
  __dirname,
  '../../tools/html-video/templates'
);

export type VideoSceneCopy = {
  title: string;
  body: string;
  duration?: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function videoTemplateIdFor(templateId?: string): string | null {
  const bind = skillBindFor(templateId);
  return bind?.videoTemplateId ?? null;
}

export async function htmlVideoTemplatesPresent(): Promise<boolean> {
  try {
    const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
    return entries.some((entry) => entry.isDirectory());
  } catch {
    return false;
  }
}

export async function listHtmlVideoTemplates(): Promise<
  Array<{ id: string; name: string; category?: string }>
> {
  try {
    const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
    const out: Array<{ id: string; name: string; category?: string }> = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const yamlPath = path.join(
        TEMPLATES_DIR,
        entry.name,
        'template.html-video.yaml'
      );
      try {
        const yaml = await fs.readFile(yamlPath, 'utf-8');
        const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim() || entry.name;
        const category = yaml.match(/^category:\s*(.+)$/m)?.[1]?.trim();
        out.push({ id: entry.name, name, category });
      } catch {
        // skip
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

async function resolveTemplateHtml(videoId: string): Promise<string | null> {
  const candidates = [
    path.join(TEMPLATES_DIR, videoId, 'source', 'index.html'),
    path.join(TEMPLATES_DIR, videoId, 'index.html'),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

function injectBrand(html: string, look: BrandLook): string {
  const css = `
<style data-lyon-brand>
  :root {
    --brand-primary: ${look.primary};
    --brand-secondary: ${look.secondary};
    --brand-accent: ${look.accent};
    --brand-bg: ${look.bg};
    --brand-text: ${look.text};
  }
</style>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${css}\n</head>`);
  }
  return css + html;
}

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
    /<(h1|h2|p)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag: string, attrs: string, inner: string) => {
      if (index >= texts.length) return full;
      if (/<(svg|img|script|style)/i.test(inner)) return full;
      const plain = inner.replace(/<[^>]+>/g, '').trim();
      if (plain.length < 2) return full;
      const value = escapeHtml(texts[index] ?? '');
      index += 1;
      return `<${tag}${attrs}>${value}</${tag}>`;
    }
  );
  next = next.replace(/HTML ANYTHING/gi, escapeHtml(brand));
  next = next.replace(/HTMLANYTHING\.DEV/gi, escapeHtml(brand));
  next = next.replace(/html-anything/gi, escapeHtml(brand));
  return next;
}

function applyHeadlineMotionClass(
  html: string,
  recipeId: string | undefined,
  title: string
): string {
  const id = (recipeId || '').toLowerCase();
  const cls = id.includes('scramble')
    ? 'scramble'
    : id.includes('shiny')
      ? 'shiny'
      : '';
  if (!cls) return html;
  return html.replace(/<h1(\b[^>]*)>/i, (full, attrs: string) => {
    if (new RegExp(`\\b${cls}\\b`).test(attrs)) {
      if (cls === 'scramble' && !/data-text=/i.test(attrs)) {
        return `<h1${attrs} data-text="${escapeHtml(title)}">`;
      }
      return full;
    }
    const withClass = /class="/i.test(attrs)
      ? attrs.replace(/class="/i, `class="${cls} `)
      : ` class="${cls}"${attrs}`;
    const withData =
      cls === 'scramble' && !/data-text=/i.test(withClass)
        ? `${withClass} data-text="${escapeHtml(title)}"`
        : withClass;
    return `<h1${withData}>`;
  });
}

function forceMotionMedia(): string {
  return `<script data-lyon-force-motion>
(function () {
  var orig = window.matchMedia ? window.matchMedia.bind(window) : null;
  window.matchMedia = function (query) {
    if (String(query).indexOf('prefers-reduced-motion') !== -1) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () { return false; }
      };
    }
    return orig ? orig(query) : { matches: false, media: query };
  };
})();
</script>`;
}

function kineticLayer(
  title: string,
  parts: ScriptPart[],
  brand: string,
  look: BrandLook,
  scenes?: VideoSceneCopy[]
): string {
  const tickerBits = [
    brand,
    title,
    ...parts
      .map((part) => part.title?.trim() || part.body?.trim() || '')
      .filter(Boolean)
      .slice(0, 6),
  ];
  const ticker = escapeHtml(tickerBits.join('  ·  '));
  const sceneJson = JSON.stringify(
    (scenes?.length
      ? scenes
      : [{ title, body: parts[0]?.body || '', duration: 5 }]
    ).map((scene) => ({
      title: scene.title || title,
      body: scene.body || '',
      duration: Math.max(3, Math.min(8, scene.duration || 5)),
    }))
  );
  return `
<style data-lyon-kinetic>
  /* Tailwind-lite so file:// still layouts if CDN is slow */
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .items-baseline { align-items: baseline; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .absolute { position: absolute; }
  .relative { position: relative; }
  .z-10 { z-index: 10; }
  .text-center { text-align: center; }
  .lyon-ticker {
    position: absolute; left: 0; right: 0; bottom: 6%;
    overflow: hidden; white-space: nowrap; z-index: 30;
    font-size: clamp(13px, 1.4vw, 18px); letter-spacing: 0.14em;
    text-transform: uppercase; opacity: 0.78; pointer-events: none;
    color: ${look.text};
  }
  .lyon-ticker-inner {
    display: inline-block;
    padding-left: 100%;
    animation: lyon-ticker 14s linear infinite;
  }
  @keyframes lyon-ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
  .lyon-type {
    overflow: hidden;
    border-right: 4px solid ${look.accent};
    white-space: nowrap;
    width: 0;
    max-width: 100%;
    margin-left: auto; margin-right: auto;
    animation: lyon-type 2.6s steps(28, end) forwards, lyon-caret 0.7s step-end infinite;
  }
  @keyframes lyon-type { to { width: 100%; } }
  @keyframes lyon-caret { 50% { border-color: transparent; } }
  .lyon-run { display: inline-block; animation: lyon-run 7s ease-in-out infinite alternate; }
  @keyframes lyon-run {
    from { transform: translateX(4%); }
    to { transform: translateX(-4%); }
  }
</style>
<div class="lyon-ticker" aria-hidden="true"><span class="lyon-ticker-inner">${ticker}  ·  ${ticker}</span></div>
<script data-lyon-scenes>
window.__LYON_SCENES__ = ${sceneJson};
document.addEventListener('DOMContentLoaded', function () {
  var scenes = window.__LYON_SCENES__ || [];
  if (!scenes.length) return;
  var h = document.querySelector('h1');
  var p = document.querySelector('main p');
  if (h) h.classList.add('lyon-run');
  var i = 0;
  function paint() {
    var scene = scenes[i % scenes.length];
    if (!scene) return;
    if (h) {
      if (typeof window.scrambleTo === 'function' && h.classList.contains('scramble')) {
        window.scrambleTo(h, scene.title);
      } else {
        h.textContent = scene.title;
      }
    }
    if (p && scene.body) p.textContent = scene.body;
    i += 1;
  }
  paint();
  var wait = (scenes[0] && scenes[0].duration ? scenes[0].duration : 5) * 1000;
  if (scenes.length > 1) setInterval(paint, wait);
});
</script>`;
}

export async function fillHtmlVideoTemplate(input: {
  templateId?: string;
  videoTemplateId?: string;
  title: string;
  parts: ScriptPart[];
  brandId?: string;
  prompt?: string;
  palette?: BrandPaletteInput | null;
  preferredMotion?: string;
  scenes?: VideoSceneCopy[];
  media?: BrandMedia | null;
}): Promise<string | null> {
  const bind = skillBindFor(input.templateId);
  const videoId =
    input.videoTemplateId || bind?.videoTemplateId || videoTemplateIdFor(input.templateId);
  if (!videoId) return null;
  const sourcePath = await resolveTemplateHtml(videoId);
  if (!sourcePath) return null;
  try {
    const raw = await fs.readFile(sourcePath, 'utf-8');
    const look = resolveBrandLook({
      brandId: input.brandId,
      prompt: input.prompt,
      palette: input.palette,
    });
    const recipeId = input.preferredMotion || bind?.motionRecipeId;
    let filled = injectVietnameseFonts(
      injectBrand(
        applyHeadlineMotionClass(
          fillCopy(raw, input.title, input.parts, look.name),
          recipeId,
          input.title
        ),
        look
      )
    );
    filled = injectMotionRecipe(filled, recipeId);
    const extras = kineticLayer(
      input.title,
      input.parts,
      look.name,
      look,
      input.scenes
    );
    if (/<head[^>]*>/i.test(filled)) {
      filled = filled.replace(/<head[^>]*>/i, (open) => `${open}\n${forceMotionMedia()}`);
    }
    if (/<\/body>/i.test(filled)) {
      filled = filled.replace(/<\/body>/i, `${extras}\n</body>`);
    } else {
      filled += extras;
    }
    return injectBrandMedia(filled, input.media);
  } catch {
    return null;
  }
}
