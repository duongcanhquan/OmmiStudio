import type { VideoScript } from './LLMService';
import { resolveBrandLook, type BrandLook, type BrandPaletteInput } from './brandLook';
import type { ScriptPart } from './scriptForm';

export { resolveBrandLook };
export type { BrandLook, BrandPaletteInput };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @deprecated — dùng resolveBrandLook */
export function resolveDocumentLook(
  brandId?: string,
  prompt?: string,
  palette?: BrandPaletteInput | null
) {
  const look = resolveBrandLook({ brandId, prompt, palette });
  return {
    name: look.name,
    bg: look.bg,
    text: look.text,
    accent: look.accent,
    secondary: look.secondary,
    primary: look.primary,
    surface: look.surface,
    ink: look.ink,
  };
}

const ICONS = {
  calendar: `<path d="M7 3v2M17 3v2M4 8h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M8 12h2v2H8z"/>`,
  map: `<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/>`,
  users: `<path d="M16 19v-1.2A3.8 3.8 0 0 0 12.2 14H7.8A3.8 3.8 0 0 0 4 17.8V19"/><circle cx="10" cy="8" r="3"/><path d="M20 19v-1.1A3.2 3.2 0 0 0 17.4 15"/><circle cx="17" cy="8.5" r="2.2"/>`,
  star: `<path d="M12 3.4l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18.3l.9-5.4-3.9-3.8 5.4-.8z"/>`,
  check: `<circle cx="12" cy="12" r="9"/><path d="M8 12.2l2.6 2.6L16.2 9"/>`,
  graduation: `<path d="M3 10.5 12 6l9 4.5L12 15 3 10.5z"/><path d="M7 12.5v4.2c0 .6 2.2 2.3 5 2.3s5-1.7 5-2.3V12.5"/>`,
  spark: `<path d="M12 3v4M12 17v4M4.2 6.2l2.8 2.8M17 15l2.8 2.8M3 12h4M17 12h4M4.2 17.8 7 15M17 9l2.8-2.8"/>`,
  book: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 7h8M8 11h6"/>`,
} as const;

type IconName = keyof typeof ICONS;

function svgIcon(name: IconName, color: string, size = 28): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

const ICON_CYCLE: IconName[] = [
  'graduation',
  'users',
  'calendar',
  'star',
  'book',
  'map',
  'check',
  'spark',
];

function blocksFrom(
  parts: ScriptPart[],
  script: VideoScript | undefined,
  title: string
): ScriptPart[] {
  if (parts.length > 0) return parts;
  if (script?.scenes?.length) {
    return script.scenes.map((scene, index) => ({
      id: `scene-${index + 1}`,
      role: 'body' as const,
      title: scene.visualText,
      body: scene.voiceoverText,
      notes: '',
    }));
  }
  return [{ id: 'one', role: 'body', title, body: '' }];
}

function fonts(): string {
  return `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap" rel="stylesheet"/>`;
}

function displayFont(): string {
  return '"Fraunces", "Be Vietnam Pro", "Times New Roman", serif';
}

function bodyFont(): string {
  return '"Be Vietnam Pro", "Arial Unicode MS", sans-serif';
}

/** Tranh nền hình học — dùng khi chưa có ảnh brand. */
function campusArt(look: BrandLook): string {
  return `<svg class="campus" viewBox="0 0 800 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="mesh" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${look.primary}"/>
        <stop offset="55%" stop-color="${look.secondary}"/>
        <stop offset="100%" stop-color="${look.ink}"/>
      </linearGradient>
      <radialGradient id="glow" cx="70%" cy="20%" r="50%">
        <stop offset="0%" stop-color="${look.accent}" stop-opacity=".85"/>
        <stop offset="100%" stop-color="${look.accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="900" fill="url(#mesh)"/>
    <rect width="800" height="900" fill="url(#glow)"/>
    <g fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.2">
      <circle cx="640" cy="160" r="120"/>
      <circle cx="640" cy="160" r="78"/>
      <path d="M0 620 L260 420 L520 640 L800 390"/>
    </g>
    <rect x="72" y="520" width="220" height="280" rx="8" fill="${look.surface}" fill-opacity=".12"/>
    <rect x="312" y="460" width="168" height="340" rx="8" fill="${look.accent}" fill-opacity=".22"/>
    <rect x="500" y="560" width="220" height="240" rx="8" fill="#fff" fill-opacity=".08"/>
  </svg>`;
}

export function buildBrandedHtml(input: {
  title: string;
  parts: ScriptPart[];
  script?: VideoScript;
  prompt?: string;
  brandId?: string;
  palette?: BrandPaletteInput | null;
  mode: 'slides' | 'poster' | 'print';
  templateType?: string;
  fieldValues?: Record<string, string>;
}): string {
  const look = resolveBrandLook({
    brandId: input.brandId,
    prompt: input.prompt,
    palette: input.palette,
  });
  const blocks = blocksFrom(input.parts, input.script, input.title);
  const type = input.templateType || '';
  const fields = input.fieldValues ?? {};

  if (type === 'certificate') return certificateHtml(input.title, blocks, look, fields);
  if (type === 'infographic') return infographicHtml(input.title, blocks, look);
  if (type === 'landing') return landingHtml(input.title, blocks, look);
  if (input.mode === 'poster' || type === 'poster' || type === 'event') {
    return posterHtml(input.title, blocks, look);
  }
  if (input.mode === 'print') return printHtml(input.title, blocks, look);
  return slidesHtml(input.title, blocks, look);
}

function posterHtml(title: string, blocks: ScriptPart[], look: BrandLook): string {
  const hero = blocks[0];
  const rest = blocks.slice(1);
  const cta =
    blocks.find((b) => b.role === 'cta')?.title ||
    rest[rest.length - 1]?.title ||
    'Đăng ký ngay';
  const cards = (rest.length ? rest : blocks)
    .filter((b) => b.role !== 'cta' || rest.length === 0)
    .slice(0, 3)
    .map((part, index) => {
      const icon = ICON_CYCLE[index % ICON_CYCLE.length];
      return `<article class="card">
        <span class="idx">${String(index + 1).padStart(2, '0')}</span>
        <span class="glyph">${svgIcon(icon, look.accent, 22)}</span>
        <h3>${escapeHtml(part.title || `Mục ${index + 1}`)}</h3>
        <p>${escapeHtml(part.body || '')}</p>
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  ${fonts()}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${bodyFont()}; background: ${look.ink}; color: ${look.ink}; }
    .sheet {
      max-width: 920px; margin: 0 auto; background: ${look.surface};
      min-height: 100vh; overflow: hidden;
    }
    .hero { position: relative; min-height: 62vh; color: #fff; isolation: isolate; }
    .hero-art { position: absolute; inset: 0; z-index: 0; }
    .hero-art .campus { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero::after {
      content: ""; position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(180deg, ${look.primary}cc 0%, ${look.ink}ee 100%);
    }
    .hero-copy {
      position: relative; z-index: 2; padding: 48px 44px 36px;
      min-height: 62vh; display: flex; flex-direction: column;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: ${look.accent}; font-weight: 700; }
    .brand .mark { width: 10px; height: 10px; border-radius: 99px; background: ${look.accent}; }
    h1 { margin: 28px 0 16px; font-family: ${displayFont()}; font-size: clamp(40px, 7vw, 68px); line-height: .98; letter-spacing: -.04em; font-weight: 700; max-width: 14ch; }
    .lead { margin: 0; font-size: 17px; line-height: 1.5; color: #e2e8f0; max-width: 36ch; font-weight: 400; }
    .cta { margin-top: auto; align-self: flex-start; background: ${look.accent}; color: ${look.ink}; font-weight: 800; padding: 14px 22px; border-radius: 2px; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid ${look.primary}22; }
    .card { padding: 28px 24px 32px; border-right: 1px solid ${look.primary}18; }
    .card:last-child { border-right: 0; }
    .idx { display: block; font-size: 11px; letter-spacing: .18em; color: ${look.primary}; font-weight: 700; margin-bottom: 10px; }
    .glyph { display: inline-flex; margin-bottom: 12px; }
    .card h3 { margin: 0 0 8px; font-size: 18px; font-family: ${displayFont()}; color: ${look.primary}; }
    .card p { margin: 0; font-size: 14px; line-height: 1.5; color: ${look.muted}; }
    footer { padding: 16px 28px 22px; display: flex; justify-content: space-between; color: ${look.muted}; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } .card { border-right: 0; border-bottom: 1px solid ${look.primary}18; } }
  </style>
</head>
<body>
  <article class="sheet">
    <header class="hero">
      <div class="hero-art">${campusArt(look)}</div>
      <div class="hero-copy">
        <p class="brand"><span class="mark"></span>${escapeHtml(look.name)}</p>
        <h1>${escapeHtml(hero?.title || title)}</h1>
        <p class="lead">${escapeHtml(hero?.body || '')}</p>
        <span class="cta">${escapeHtml(cta)}</span>
      </div>
    </header>
    <section class="grid">${cards}</section>
    <footer><span>${escapeHtml(look.name)}</span><span>Ấn phẩm thiết kế</span></footer>
  </article>
</body>
</html>`;
}

function slidesHtml(title: string, blocks: ScriptPart[], look: BrandLook): string {
  const slides = blocks
    .map((part, index) => {
      const icon = ICON_CYCLE[index % ICON_CYCLE.length];
      return `<section class="slide">
        <aside>
          <p class="num">${String(index + 1).padStart(2, '0')}</p>
          ${svgIcon(icon, look.accent, 48)}
          <p class="brand">${escapeHtml(look.name)}</p>
        </aside>
        <div class="copy">
          <p class="kicker">${escapeHtml(title)}</p>
          <h2>${escapeHtml(part.title || `Slide ${index + 1}`)}</h2>
          <p>${escapeHtml(part.body || '').replace(/\n/g, '<br/>')}</p>
        </div>
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  ${fonts()}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${bodyFont()}; background: ${look.ink}; }
    .slide { min-height: 100vh; display: grid; grid-template-columns: 240px 1fr; page-break-after: always; }
    aside { background: ${look.primary}; color: #fff; padding: 40px 28px; display: flex; flex-direction: column; gap: 18px; }
    .num { margin: 0; font-family: ${displayFont()}; font-size: 56px; font-weight: 700; color: ${look.accent}; line-height: 1; }
    .brand { margin-top: auto; letter-spacing: .16em; text-transform: uppercase; font-size: 11px; }
    .copy { background: ${look.surface}; color: ${look.ink}; padding: 64px 64px; display: flex; flex-direction: column; justify-content: center; }
    .kicker { margin: 0 0 12px; color: ${look.primary}; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    h2 { margin: 0 0 18px; font-family: ${displayFont()}; font-size: clamp(32px, 4.5vw, 48px); line-height: 1.08; letter-spacing: -.03em; }
    .copy p:last-child { margin: 0; font-size: 20px; line-height: 1.55; color: ${look.muted}; max-width: 38ch; }
  </style>
</head>
<body>${slides}</body>
</html>`;
}

function printHtml(title: string, blocks: ScriptPart[], look: BrandLook): string {
  const sections = blocks
    .map((part, index) => {
      const icon = ICON_CYCLE[index % ICON_CYCLE.length];
      return `<section>
        <div class="row">${svgIcon(icon, look.primary, 22)}<h2>${escapeHtml(part.title || `Mục ${index + 1}`)}</h2></div>
        <p>${escapeHtml(part.body || '').replace(/\n/g, '<br/>')}</p>
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  ${fonts()}
  <style>
    @page { size: A4; margin: 16mm; }
    body { margin: 0; font-family: ${bodyFont()}; background: ${look.surface}; color: ${look.ink}; }
    header { background: ${look.primary}; color: #fff; padding: 36px 40px 32px; }
    header p { margin: 0; color: ${look.accent}; letter-spacing: .18em; text-transform: uppercase; font-size: 11px; font-weight: 700; }
    h1 { margin: 10px 0 0; font-family: ${displayFont()}; font-size: 36px; letter-spacing: -.02em; line-height: 1.1; }
    main { padding: 28px 32px 40px; }
    section { margin: 0 0 22px; padding-bottom: 16px; border-bottom: 1px solid ${look.primary}22; }
    .row { display: flex; align-items: center; gap: 10px; }
    h2 { margin: 0; color: ${look.primary}; font-size: 20px; }
    p { margin: 8px 0 0; line-height: 1.55; color: ${look.muted}; }
  </style>
</head>
<body>
  <header><p>${escapeHtml(look.name)}</p><h1>${escapeHtml(title)}</h1></header>
  <main>${sections}</main>
</body>
</html>`;
}

function infographicHtml(title: string, blocks: ScriptPart[], look: BrandLook): string {
  const tiles = blocks
    .map((part, index) => {
      const icon = ICON_CYCLE[index % ICON_CYCLE.length];
      return `<article>
        <span>${svgIcon(icon, look.accent, 32)}</span>
        <strong>${escapeHtml(part.title)}</strong>
        <p>${escapeHtml(part.body || '')}</p>
      </article>`;
    })
    .join('');
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>${fonts()}
<style>
  body { margin: 0; font-family: ${bodyFont()}; background: ${look.ink}; color: #fff; }
  .wrap { max-width: 920px; margin: 0 auto; padding: 48px 32px 56px; }
  .top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 24px; }
  h1 { margin: 0; font-family: ${displayFont()}; font-size: clamp(32px, 5vw, 48px); max-width: 14ch; line-height: 1.05; letter-spacing: -.03em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  article { background: ${look.surface}; color: ${look.ink}; border-radius: 4px; padding: 24px; min-height: 180px; }
  article span { display: inline-flex; width: 44px; height: 44px; border-radius: 4px; background: ${look.primary}; align-items: center; justify-content: center; }
  strong { display: block; margin: 16px 0 8px; font-size: 22px; font-family: ${displayFont()}; color: ${look.primary}; }
  p { margin: 0; color: ${look.muted}; line-height: 1.5; }
</style></head>
<body><div class="wrap">
  <div class="top"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(look.name)}</p></div>
  <div class="grid">${tiles}</div>
</div></body></html>`;
}

function landingHtml(title: string, blocks: ScriptPart[], look: BrandLook): string {
  const hero = blocks[0];
  const rest = blocks.slice(1);
  const cards = rest
    .map((part, index) => `<article>${svgIcon(ICON_CYCLE[index % ICON_CYCLE.length], look.primary, 28)}<h3>${escapeHtml(part.title)}</h3><p>${escapeHtml(part.body || '')}</p></article>`)
    .join('');
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>${fonts()}
<style>
  body { margin: 0; font-family: ${bodyFont()}; background: ${look.surface}; color: ${look.ink}; }
  .hero { display: grid; grid-template-columns: 1.05fr .95fr; min-height: 72vh; background: ${look.primary}; color: #fff; }
  .hero div:first-child { padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; }
  .brand { color: ${look.accent}; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; font-size: 11px; margin: 0; }
  h1 { font-family: ${displayFont()}; font-size: clamp(40px, 5vw, 56px); line-height: 1.02; margin: 16px 0 18px; letter-spacing: -.03em; max-width: 12ch; }
  .cta { display: inline-block; background: ${look.accent}; color: ${look.ink}; font-weight: 800; padding: 14px 22px; border-radius: 2px; letter-spacing: .06em; text-transform: uppercase; font-size: 12px; margin-top: 12px; }
  .cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 1px; background: ${look.primary}22; padding: 0; }
  article { background: #fff; padding: 28px 24px 32px; }
  h3 { color: ${look.primary}; margin: 12px 0 8px; font-family: ${displayFont()}; }
</style></head>
<body>
  <header class="hero">
    <div>
      <p class="brand">${escapeHtml(look.name)}</p>
      <h1>${escapeHtml(hero?.title || title)}</h1>
      <p>${escapeHtml(hero?.body || '')}</p>
      <span class="cta">Đăng ký ngay</span>
    </div>
    <div>${campusArt(look)}</div>
  </header>
  <section class="cards">${cards}</section>
</body></html>`;
}

function certificateHtml(
  title: string,
  blocks: ScriptPart[],
  look: BrandLook,
  fields: Record<string, string>
): string {
  const who = fields.recipient?.trim() || blocks[0]?.title || title;
  const why =
    fields.achievement?.trim() ||
    blocks[0]?.body ||
    blocks[1]?.title ||
    '';
  const date = fields.date?.trim() || '';
  const signer = fields.signer?.trim() || look.name;
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>${fonts()}
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: ${look.ink}; font-family: ${bodyFont()}; }
  .cert {
    width: min(960px, 94vw); aspect-ratio: 1.414/1; background: ${look.surface}; color: ${look.ink};
    border: 14px solid ${look.primary}; outline: 1px solid ${look.accent}; outline-offset: -28px;
    padding: 56px 64px; text-align: center; display: flex; flex-direction: column; justify-content: center;
  }
  .seal { width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; border: 2px solid ${look.accent}; display: grid; place-items: center; color: ${look.primary}; }
  p.k { letter-spacing: .28em; text-transform: uppercase; color: ${look.primary}; font-weight: 700; font-size: 11px; margin: 0; }
  p.sub { margin: 8px 0 0; color: ${look.muted}; font-size: 14px; }
  h1 { font-family: ${displayFont()}; font-size: 28px; margin: 20px 0 8px; font-weight: 500; letter-spacing: .04em; }
  h2 { font-family: ${displayFont()}; font-size: clamp(32px, 4vw, 44px); color: ${look.primary}; margin: 8px 0 16px; line-height: 1.1; }
  .why { max-width: 48ch; margin: 0 auto; font-size: 16px; line-height: 1.55; color: ${look.muted}; }
  .meta { margin-top: 36px; display: flex; justify-content: space-between; font-size: 13px; letter-spacing: .04em; }
</style></head>
<body>
  <article class="cert">
    <div class="seal">${svgIcon('graduation', look.primary, 32)}</div>
    <p class="k">${escapeHtml(look.name)}</p>
    <p class="sub">Chứng chỉ / giấy khen</p>
    <h1>${escapeHtml(title)}</h1>
    <h2>${escapeHtml(who)}</h2>
    <p class="why">${escapeHtml(why)}</p>
    <div class="meta"><span>${escapeHtml(date)}</span><span>${escapeHtml(signer)}</span></div>
  </article>
</body></html>`;
}

export function buildSocialGraphicHtml(input: {
  title: string;
  parts: ScriptPart[];
  prompt?: string;
  brandId?: string;
  palette?: BrandPaletteInput | null;
  cta?: string;
  aspect?: string;
}): string {
  const look = resolveBrandLook({
    brandId: input.brandId,
    prompt: input.prompt,
    palette: input.palette,
  });
  const frames = blocksFrom(input.parts, undefined, input.title);
  const cta = input.cta?.trim() || 'Tìm hiểu thêm';
  const portrait = input.aspect === '9:16' || input.aspect === '4:5';
  const square = input.aspect === '1:1' || !input.aspect;
  const frameCss = portrait
    ? 'width:min(420px,92vw);aspect-ratio:9/16;'
    : square
      ? 'width:min(540px,92vw);aspect-ratio:1/1;'
      : 'width:min(720px,92vw);aspect-ratio:16/9;';

  const cards = frames
    .map((part, index) => {
      return `
    <article class="post">
      <div class="photo">${campusArt(look)}</div>
      <div class="scrim"></div>
      <div class="body">
        <p class="brand">${escapeHtml(look.name)}</p>
        <h2>${escapeHtml(part.title || input.title || `Khung ${index + 1}`)}</h2>
        ${part.body ? `<p class="copy">${escapeHtml(part.body).replace(/\n/g, '<br/>')}</p>` : ''}
        <span class="cta">${escapeHtml(cta)}</span>
      </div>
    </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.title || look.name)}</title>
  ${fonts()}
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh;
      font-family: ${bodyFont()};
      background: ${look.ink};
      display: flex; flex-wrap: wrap; gap: 32px; justify-content: center;
      align-items: flex-start; padding: 40px 20px 56px;
    }
    .post {
      ${frameCss}
      position: relative; overflow: hidden; color: #fff;
      display: flex; flex-direction: column; justify-content: flex-end;
      box-shadow: 0 24px 60px #0008;
    }
    .photo { position: absolute; inset: 0; }
    .photo .campus { width: 100%; height: 100%; object-fit: cover; display: block; }
    .scrim { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, ${look.ink}f2 100%); }
    .body { position: relative; z-index: 2; padding: 28px 26px 26px; display: flex; flex-direction: column; }
    .brand { margin: 0; color: ${look.accent}; font-size: 11px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; }
    h2 { margin: 12px 0 10px; font-family: ${displayFont()}; font-size: clamp(28px, 6vw, 40px); line-height: 1.05; letter-spacing: -.03em; }
    .copy { margin: 0 0 18px; color: #e2e8f0; font-size: 15px; line-height: 1.45; max-width: 28ch; }
    .cta { align-self: flex-start; background: ${look.accent}; color: ${look.ink}; font-size: 12px; font-weight: 800; padding: 10px 16px; letter-spacing: .08em; text-transform: uppercase; }
  </style>
</head>
<body>${cards}</body>
</html>`;
}
