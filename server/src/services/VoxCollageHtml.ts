import type { BrandLook } from './brandLook';
import type { ScriptPart } from './scriptForm';
import {
  compositionForKind,
  isVoxLayoutKind,
  themeForKind,
  type VoxComposition,
  type VoxLayoutKind,
  type VoxTexture,
  type VoxTheme,
} from '../config/vox-themes';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textureOverlay(kind: VoxTexture, ink: string): string {
  if (kind === 'xerox') {
    return `repeating-linear-gradient(0deg, ${ink}14 0 1px, transparent 1px 3px)`;
  }
  if (kind === 'rice') {
    return `radial-gradient(ellipse at 20% 10%, ${ink}10, transparent 40%), radial-gradient(ellipse at 80% 90%, ${ink}08, transparent 45%)`;
  }
  if (kind === 'foil') {
    return `linear-gradient(135deg, #c9a22722, transparent 40%, #efe4c822)`;
  }
  return `radial-gradient(${ink}40 0.9px, transparent 1.1px)`;
}

function scraps(theme: VoxTheme, punchy: boolean): string {
  const a = theme.accent;
  const s = theme.secondary;
  const p = theme.paper;
  const speed = punchy ? '6s' : '12s';
  return `
    <i class="scrap s1" style="background:${a}"></i>
    <i class="scrap s2" style="background:${s}"></i>
    <i class="scrap s3" style="background:${p}"></i>
    <i class="tape t1"></i>
    <i class="tape t2"></i>
    <style>
      .scrap { position:absolute; display:block; box-shadow: 3px 6px 0 ${theme.ink}22; animation: flutter ${speed} ease-in-out infinite; }
      .s1 { width:72px; height:54px; left:4%; top:8%; clip-path: polygon(6% 8%, 92% 0, 100% 78%, 8% 100%); transform:rotate(-12deg); }
      .s2 { width:58px; height:70px; right:6%; top:14%; clip-path: polygon(0 12%, 100% 0, 88% 100%, 10% 86%); transform:rotate(18deg); animation-delay:-2s; }
      .s3 { width:90px; height:40px; left:8%; bottom:10%; transform:rotate(-8deg); animation-delay:-3.4s; }
      .tape { position:absolute; width:86px; height:18px; background: #e8d9a8cc; box-shadow: 0 2px 0 ${theme.ink}1a; }
      .t1 { top: 18%; left: 28%; transform: rotate(-8deg); }
      .t2 { bottom: 22%; right: 18%; transform: rotate(14deg); }
    </style>
  `;
}

function paperCard(inner: string, extra = ''): string {
  return `<div class="paper" style="${extra}">${inner}</div>`;
}

function composeInner(
  composition: VoxComposition,
  theme: VoxTheme,
  title: string,
  line: string,
  items: string[],
  cta: string,
  metric: string
): string {
  const t = esc(title);
  const sub = esc(line);
  const action = esc(cta);
  const num = esc(metric || '3');

  switch (composition) {
    case 'grid':
      return `
        <div class="stage-pad swiss">
          <p class="kicker">${esc(theme.era)}</p>
          <h1>${t}</h1>
          <div class="swiss-grid">
            ${items
              .slice(0, 3)
              .map(
                (row, i) =>
                  `<div class="swiss-cell"><span>0${i + 1}</span><p>${esc(row)}</p></div>`
              )
              .join('')}
          </div>
        </div>`;
    case 'diagonal':
      return `
        <div class="diag-bar"></div>
        <div class="stage-pad diag">
          <p class="kicker">${esc(theme.era).toUpperCase()}</p>
          <h1>${t}</h1>
          <p class="sub">${sub}</p>
        </div>`;
    case 'columns':
      return `
        <div class="stage-pad news">
          <header class="mast"><span>THE BRIEF</span><span>VOL. 01</span></header>
          <h1>${t}</h1>
          <div class="cols">
            <p>${sub || items[0] || ''}</p>
            <p>${esc(items[1] || items[0] || action)}</p>
          </div>
        </div>`;
    case 'list':
      return `
        <div class="stage-pad">
          <h1 class="list-h">${t}</h1>
          <ol class="list-cards">
            ${items
              .slice(0, 4)
              .map(
                (row, i) =>
                  `<li>${paperCard(`<b>0${i + 1}</b><span>${esc(row)}</span>`)}</li>`
              )
              .join('')}
          </ol>
        </div>`;
    case 'timeline':
      return `
        <div class="stage-pad">
          <h1>${t}</h1>
          <div class="time-rail">
            ${items
              .slice(0, 4)
              .map(
                (row, i) =>
                  `<div class="time-node">${paperCard(`<small>0${i + 1}</small><p>${esc(row)}</p>`)}</div>`
              )
              .join('')}
          </div>
        </div>`;
    case 'stat':
      return `
        <div class="stage-pad stat">
          ${paperCard(`<p class="mega">${num}</p><h1>${t}</h1><p class="sub">${sub}</p>`)}
        </div>`;
    case 'seal':
      return `
        <div class="stage-pad seal-layout">
          <div class="seal">印</div>
          ${paperCard(`<p class="kicker">${esc(theme.era)}</p><h1>${t}</h1><p class="sub">${sub}</p>`)}
        </div>`;
    case 'hero':
    default:
      return `
        <div class="stage-pad hero">
          ${paperCard(
            `<p class="kicker">${esc(theme.era)}</p><h1>${t}</h1><p class="sub">${sub}</p><span class="cta">${action}</span>`
          )}
        </div>`;
  }
}

export function renderVoxCollageHtml(input: {
  kind: string;
  title: string;
  parts: ScriptPart[];
  look: BrandLook;
  fieldValues?: Record<string, string>;
}): string | null {
  if (!isVoxLayoutKind(input.kind)) return null;

  const kind = input.kind as VoxLayoutKind;
  const theme = themeForKind(kind);
  const composition = compositionForKind(kind);
  const fv = input.fieldValues ?? {};
  const parts = input.parts;
  const title = (fv.title || input.title || input.look.name).trim();
  const line =
    fv.subtitle ||
    fv.hook ||
    parts.find((p) => p.body?.trim())?.body?.trim() ||
    parts[0]?.title ||
    '';
  const cta =
    fv.cta ||
    parts.find((p) => p.role === 'cta')?.title ||
    'Tìm hiểu thêm';
  const items = parts
    .map((p) => p.title?.trim() || p.body?.trim() || '')
    .filter(Boolean);
  const metric = fv.stats || fv.metric || items.find((row) => /\d/.test(row)) || '3';
  const punchy = theme.motion === 'punchy';
  const fg = theme.bg === '#111111' || theme.bg === '#1c1914' || theme.bg === '#0f3d4c' || theme.bg === '#2f4a3c'
    ? theme.paper
    : theme.ink;

  const inner = composeInner(
    composition,
    theme,
    title,
    line,
    items.length ? items : [line || cta],
    cta,
    metric
  );

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Noto+Serif+SC:wght@700&family=Playfair+Display:wght@700;800&family=Special+Elite&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body {
    min-height: 100vh;
    background: ${theme.bg};
    color: ${fg};
    font-family: ${theme.body};
  }
  .vox {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    background: ${theme.bg};
  }
  .vox::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: ${textureOverlay(theme.texture, theme.ink)};
    background-size: ${theme.texture === 'halftone' ? '5px 5px' : 'auto'};
    opacity: ${theme.texture === 'xerox' ? 0.55 : 0.32};
    mix-blend-mode: multiply;
    z-index: 4;
  }
  .stage-pad { position: relative; z-index: 2; min-height: 100vh; padding: 7vh 6vw; display: flex; flex-direction: column; justify-content: center; }
  h1 {
    font-family: ${theme.display};
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 0.88;
    font-size: clamp(42px, 8vw, 92px);
    text-transform: ${composition === 'seal' ? 'none' : 'uppercase'};
  }
  .kicker { letter-spacing: 0.22em; text-transform: uppercase; font-size: 12px; opacity: 0.72; margin-bottom: 16px; }
  .sub { margin-top: 16px; max-width: 36ch; font-size: 18px; line-height: 1.45; opacity: 0.86; }
  .cta {
    display: inline-block; margin-top: 22px; padding: 10px 18px;
    background: ${theme.accent}; color: ${theme.bg === theme.accent ? theme.ink : theme.paper};
    font-weight: 800; font-size: 14px;
  }
  .paper {
    background: ${theme.paper};
    color: ${theme.ink};
    padding: 36px 40px;
    box-shadow: 6px 10px 0 ${theme.ink}24, 0 18px 40px ${theme.ink}28;
    clip-path: polygon(1% 2%, 18% 0, 47% 2%, 72% 0, 99% 3%, 100% 38%, 98% 71%, 100% 100%, 68% 98%, 39% 100%, 12% 97%, 0 100%, 2% 62%, 0 24%);
    animation: settle ${punchy ? '8s' : '14s'} ease-in-out infinite;
  }
  .swiss h1 { max-width: 14ch; }
  .swiss-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; margin-top: 36px; }
  .swiss-cell { border-top: 3px solid ${theme.accent}; padding-top: 12px; }
  .swiss-cell span { display: block; color: ${theme.accent}; font-weight: 800; font-size: 22px; }
  .diag-bar { position: absolute; left: -10%; top: 18%; width: 120%; height: 28%; background: ${theme.accent}; transform: rotate(-12deg); z-index: 1; }
  .diag { z-index: 2; }
  .diag h1 { max-width: 12ch; }
  .mast { display: flex; justify-content: space-between; border-bottom: 3px solid ${theme.ink}; padding-bottom: 8px; margin-bottom: 20px; font-weight: 800; letter-spacing: 0.16em; font-size: 12px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; column-rule: 1px solid ${theme.ink}33; }
  .list-h { margin-bottom: 20px; }
  .list-cards { list-style: none; display: grid; gap: 12px; }
  .list-cards .paper { display: flex; gap: 16px; align-items: baseline; padding: 16px 20px; }
  .list-cards b { color: ${theme.accent}; font-size: 28px; }
  .time-rail { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 28px; }
  .time-node .paper { padding: 16px; min-height: 140px; }
  .time-node small { color: ${theme.accent}; font-weight: 800; }
  .mega { font-family: ${theme.display}; font-size: clamp(80px, 18vw, 180px); line-height: 0.8; color: ${theme.accent}; }
  .seal-layout { align-items: flex-start; }
  .seal {
    position: absolute; right: 9vw; top: 12vh; width: 96px; height: 96px;
    border: 6px solid ${theme.accent}; color: ${theme.accent}; border-radius: 8px;
    display: grid; place-items: center; font-size: 40px; font-weight: 800;
    transform: rotate(12deg); background: ${theme.paper}; z-index: 3;
    animation: flutter 10s ease-in-out infinite;
  }
  .hero .paper { max-width: 18ch; }
  @keyframes settle {
    0%, 100% { transform: translateY(0) rotate(-0.4deg); }
    50% { transform: translateY(-6px) rotate(0.5deg); }
  }
  @keyframes flutter {
    0%, 100% { transform: translateY(0) rotate(var(--r, -8deg)); }
    50% { transform: translateY(-8px) rotate(calc(var(--r, -8deg) + 3deg)); }
  }
</style>
</head>
<body>
  <div class="vox">
    ${scraps(theme, punchy)}
    ${inner}
  </div>
</body>
</html>`;
}

export { isVoxLayoutKind };
