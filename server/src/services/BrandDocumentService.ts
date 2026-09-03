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

function campusArt(look: BrandLook): string {
  return `<svg class="campus" viewBox="0 0 640 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${look.secondary}"/>
        <stop offset="100%" stop-color="${look.primary}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#sky)"/>
    <circle cx="520" cy="78" r="46" fill="${look.accent}" opacity=".9"/>
    <rect x="70" y="168" width="160" height="190" rx="8" fill="${look.surface}" opacity=".92"/>
    <rect x="92" y="190" width="40" height="40" fill="${look.primary}"/>
    <rect x="148" y="190" width="40" height="40" fill="${look.secondary}"/>
    <rect x="92" y="246" width="40" height="40" fill="${look.secondary}"/>
    <rect x="148" y="246" width="40" height="40" fill="${look.accent}"/>
    <rect x="250" y="120" width="190" height="238" rx="10" fill="${look.surface}" opacity=".95"/>
    <polygon points="240,120 345,52 460,120" fill="${look.accent}"/>
    <rect x="318" y="268" width="54" height="90" fill="${look.primary}"/>
    <rect x="276" y="156" width="36" height="36" fill="${look.secondary}"/>
    <rect x="378" y="156" width="36" height="36" fill="${look.primary}"/>
    <rect x="276" y="208" width="36" height="36" fill="${look.primary}"/>
    <rect x="378" y="208" width="36" height="36" fill="${look.secondary}"/>
    <rect x="470" y="188" width="120" height="170" rx="8" fill="${look.surface}" opacity=".9"/>
    <rect x="492" y="210" width="32" height="32" fill="${look.accent}"/>
    <rect x="536" y="210" width="32" height="32" fill="${look.primary}"/>
    <rect x="492" y="256" width="32" height="32" fill="${look.primary}"/>
    <rect x="536" y="256" width="32" height="32" fill="${look.secondary}"/>
    <rect x="0" y="350" width="640" height="70" fill="${look.ink}" opacity=".18"/>
    <circle cx="118" cy="338" r="18" fill="${look.ink}" opacity=".35"/>
    <rect x="104" y="356" width="28" height="36" rx="6" fill="${look.ink}" opacity=".35"/>
    <circle cx="178" cy="338" r="16" fill="${look.ink}" opacity=".28"/>
    <rect x="166" y="354" width="24" height="34" rx="6" fill="${look.ink}" opacity=".28"/>
  </svg>`;
}

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
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet"/>`;
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
}): string {
  const look = resolveBrandLook({
    brandId: input.brandId,
    prompt: input.prompt,
    palette: input.palette,
  });
  const blocks = blocksFrom(input.parts, input.script, input.title);
  const type = input.templateType || '';

  if (type === 'certificate') return certificateHtml(input.title, blocks, look);
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
    .slice(0, 4)
    .map((part, index) => {
      const icon = ICON_CYCLE[index % ICON_CYCLE.length];
      return `<article class="card">
        <span class="glyph">${svgIcon(icon, look.primary, 26)}</span>
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
    body { margin: 0; font-family: "Be Vietnam Pro", "Arial Unicode MS", sans-serif; background: #e2e8f0; color: ${look.ink}; }
    .sheet {
      max-width: 900px; margin: 24px auto; background: ${look.surface};
      overflow: hidden; box-shadow: 0 24px 60px #0f172a33;
    }
    .hero { display: grid; grid-template-columns: 1.1fr .9fr; min-height: 380px; background: ${look.primary}; color: #fff; }
    .hero-copy { padding: 40px 36px 32px; display: flex; flex-direction: column; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: ${look.accent}; font-weight: 700; }
    .brand .mark { width: 28px; height: 28px; border-radius: 8px; background: ${look.accent}; }
    h1 { margin: 18px 0 12px; font-size: 46px; line-height: 1.08; letter-spacing: -.03em; }
    .lead { margin: 0; font-size: 18px; line-height: 1.45; color: #dbeafe; max-width: 28ch; }
    .cta { margin-top: auto; align-self: flex-start; background: ${look.accent}; color: ${look.ink}; font-weight: 800; padding: 12px 20px; border-radius: 999px; font-size: 15px; }
    .hero-art { position: relative; min-height: 280px; }
    .hero-art .campus { width: 100%; height: 100%; display: block; object-fit: cover; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 28px 32px 36px; }
    .card { background: #fff; border: 1px solid ${look.primary}22; border-radius: 18px; padding: 18px 18px 16px; box-shadow: 0 8px 24px ${look.primary}14; }
    .glyph { display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center; border-radius: 12px; background: ${look.primary}14; margin-bottom: 10px; }
    .card h3 { margin: 0 0 6px; font-size: 17px; color: ${look.primary}; }
    .card p { margin: 0; font-size: 14px; line-height: 1.45; color: ${look.muted}; }
    footer { padding: 14px 32px 22px; display: flex; justify-content: space-between; color: ${look.muted}; font-size: 12px; }
    @media (max-width: 720px) { .hero, .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <article class="sheet">
    <header class="hero">
      <div class="hero-copy">
        <p class="brand"><span class="mark"></span>${escapeHtml(look.name)}</p>
        <h1>${escapeHtml(hero?.title || title)}</h1>
        <p class="lead">${escapeHtml(hero?.body || '')}</p>
        <span class="cta">${escapeHtml(cta)}</span>
      </div>
      <div class="hero-art">${campusArt(look)}</div>
    </header>
    <section class="grid">${cards}</section>
    <footer><span>${escapeHtml(look.name)}</span><span>Ấn phẩm LYON Studio</span></footer>
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
    body { margin: 0; font-family: "Be Vietnam Pro", "Arial Unicode MS", sans-serif; background: ${look.ink}; }
    .slide { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr; page-break-after: always; }
    aside { background: ${look.primary}; color: #fff; padding: 36px 28px; display: flex; flex-direction: column; gap: 18px; }
    .num { margin: 0; font-size: 42px; font-weight: 800; color: ${look.accent}; }
    .brand { margin-top: auto; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
    .copy { background: ${look.surface}; color: ${look.ink}; padding: 56px 56px; display: flex; flex-direction: column; justify-content: center; }
    .kicker { margin: 0 0 10px; color: ${look.primary}; font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h2 { margin: 0 0 16px; font-size: 40px; line-height: 1.15; }
    .copy p:last-child { margin: 0; font-size: 20px; line-height: 1.5; color: ${look.muted}; max-width: 36ch; }
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
    body { margin: 0; font-family: "Be Vietnam Pro", "Arial Unicode MS", sans-serif; background: ${look.surface}; color: ${look.ink}; }
    header { background: ${look.primary}; color: #fff; padding: 28px 32px; }
    header p { margin: 0; color: ${look.accent}; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; font-weight: 700; }
    h1 { margin: 8px 0 0; font-size: 32px; }
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
  body { margin: 0; font-family: "Be Vietnam Pro", sans-serif; background: ${look.primary}; color: #fff; }
  .wrap { max-width: 880px; margin: 0 auto; padding: 40px 28px 48px; }
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
  h1 { margin: 0; font-size: 36px; max-width: 16ch; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  article { background: ${look.surface}; color: ${look.ink}; border-radius: 20px; padding: 20px; min-height: 160px; }
  article span { display: inline-flex; width: 48px; height: 48px; border-radius: 14px; background: ${look.primary}; align-items: center; justify-content: center; }
  strong { display: block; margin: 12px 0 6px; font-size: 20px; color: ${look.primary}; }
  p { margin: 0; color: ${look.muted}; }
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
  body { margin: 0; font-family: "Be Vietnam Pro", sans-serif; background: ${look.surface}; color: ${look.ink}; }
  .hero { display: grid; grid-template-columns: 1fr 1fr; background: ${look.primary}; color: #fff; }
  .hero div { padding: 56px 48px; }
  .brand { color: ${look.accent}; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
  h1 { font-size: 48px; line-height: 1.1; margin: 12px 0; }
  .cta { display: inline-block; background: ${look.accent}; color: ${look.ink}; font-weight: 800; padding: 12px 22px; border-radius: 999px; }
  .cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; padding: 36px 48px 56px; }
  article { background: #fff; border-radius: 18px; padding: 20px; box-shadow: 0 10px 30px ${look.primary}18; }
  h3 { color: ${look.primary}; margin: 10px 0 6px; }
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

function certificateHtml(title: string, blocks: ScriptPart[], look: BrandLook): string {
  const who = blocks[0]?.title || title;
  const why = blocks[0]?.body || blocks[1]?.title || '';
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>${fonts()}
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: ${look.ink}; font-family: "Be Vietnam Pro", serif; }
  .cert { width: min(920px, 94vw); aspect-ratio: 1.414/1; background: ${look.surface}; color: ${look.ink}; border: 18px solid ${look.primary}; box-shadow: inset 0 0 0 6px ${look.accent}; padding: 48px; text-align: center; }
  .seal { width: 84px; height: 84px; margin: 0 auto 12px; border-radius: 50%; background: ${look.accent}; display: grid; place-items: center; color: ${look.ink}; font-weight: 800; }
  p.k { letter-spacing: .2em; text-transform: uppercase; color: ${look.primary}; font-weight: 700; }
  h1 { font-size: 40px; margin: 8px 0 16px; }
  h2 { font-size: 34px; color: ${look.primary}; margin: 0 0 12px; }
</style></head>
<body>
  <article class="cert">
    <div class="seal">${svgIcon('graduation', look.ink, 36)}</div>
    <p class="k">${escapeHtml(look.name)}</p>
    <h1>Giấy khen / chứng chỉ</h1>
    <h2>${escapeHtml(who)}</h2>
    <p>${escapeHtml(why)}</p>
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
      const icon = ICON_CYCLE[index % ICON_CYCLE.length];
      return `
    <article class="post">
      <div class="photo">${campusArt(look)}</div>
      <div class="body">
        <p class="brand">${svgIcon(icon, look.accent, 18)} ${escapeHtml(look.name)}</p>
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
      font-family: "Be Vietnam Pro", "Arial Unicode MS", sans-serif;
      background: #cbd5e1;
      display: flex; flex-wrap: wrap; gap: 28px; justify-content: center;
      align-items: flex-start; padding: 36px 20px 48px;
    }
    .post {
      ${frameCss}
      overflow: hidden; background: ${look.surface}; color: ${look.ink};
      display: flex; flex-direction: column;
      box-shadow: 0 18px 50px #0f172a33; border-radius: 4px;
    }
    .photo { height: 46%; min-height: 160px; background: ${look.primary}; }
    .photo .campus { width: 100%; height: 100%; object-fit: cover; display: block; }
    .body { flex: 1; padding: 22px 22px 20px; display: flex; flex-direction: column; }
    .brand { margin: 0; display: flex; align-items: center; gap: 8px; color: ${look.primary}; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    h2 { margin: 10px 0 8px; font-size: clamp(24px, 5vw, 34px); line-height: 1.15; color: ${look.ink}; }
    .copy { margin: 0; color: ${look.muted}; font-size: 15px; line-height: 1.45; }
    .cta { margin-top: auto; align-self: flex-start; background: ${look.accent}; color: ${look.ink}; font-size: 14px; font-weight: 800; padding: 10px 16px; border-radius: 999px; }
  </style>
</head>
<body>${cards}</body>
</html>`;
}
