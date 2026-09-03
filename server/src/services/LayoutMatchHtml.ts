import type { BrandLook } from './brandLook';
import type { ScriptPart } from './scriptForm';

/** Khớp `kind` trên client `layoutCatalog.ts` — xuất đúng khung đã chọn. */
export const LAYOUT_KIND_BY_ID: Record<string, string> = {
  'fb-pastel-hero': 'pastel-hero',
  'fb-knowledge': 'knowledge',
  'fb-checklist': 'checklist',
  'fb-quote': 'quote-center',
  'fb-event-date': 'event-date',
  'fb-photo-word': 'photo-word',
  'fb-magazine': 'magazine',
  'fb-offer': 'offer-price',
  'fb-product': 'product-split',
  'fb-menu': 'menu-card',
  'fb-hours': 'hours-cta',
  'fb-metric': 'metric-hero',
  'fb-feature': 'feature-ui',
  'fb-calm': 'calm-tip',
  'fb-trust': 'trust-badge',
  'story-white': 'story-white',
  'story-pastel': 'story-pastel',
  'story-offer': 'story-offer',
  'car-cinematic': 'car-cinematic',
  'car-xhs': 'car-xhs',
  'vid-liquid': 'vid-liquid',
  'vid-warm': 'vid-warm',
  'vid-cursor': 'vid-cursor',
  'vid-kinetic': 'vid-kinetic',
  'vid-stat': 'vid-stat',
  'poster-sketch': 'poster-sketch',
  'poster-mag': 'poster-mag',
  'poster-hero': 'poster-hero',
  'deck-launch': 'deck-launch',
  'deck-swiss': 'deck-swiss',
  'deck-course': 'deck-course',
  'info-dash': 'info-dash',
  'land-soft': 'land-soft',
  'land-saas': 'land-saas',
  'event-wait': 'event-wait',
  'doc-parchment': 'sheet-doc',
  'mail-digest': 'sheet-email',
  'brochure-guide': 'sheet-brochure',
  'cert-magazine': 'cert-formal',
  'cv-modern': 'resume-col',
  'sheet-notes': 'worksheet',
  'quiz-module': 'quiz',
};

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headlineAccent(text: string, accent: string): string {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length < 2) return esc(text);
  const last = words.pop() as string;
  return `${esc(words.join(' '))} <span style="color:${accent}">${esc(last)}</span>`;
}

export function resolveLayoutKind(
  layoutId?: string,
  layoutKind?: string
): string | undefined {
  const explicit = layoutKind?.trim();
  if (explicit) return explicit;
  if (layoutId && LAYOUT_KIND_BY_ID[layoutId]) return LAYOUT_KIND_BY_ID[layoutId];
  return undefined;
}

function wrap(look: BrandLook, inner: string, extra = ''): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Be Vietnam Pro', system-ui, sans-serif;
    background: ${look.bg};
    color: ${look.ink};
    min-height: 100vh;
  }
  h1, h2, .display { font-family: Fraunces, Georgia, serif; letter-spacing: -0.03em; }
  .stage { min-height: 100vh; width: 100%; }
  ${extra}
</style>
</head>
<body>${inner}</body>
</html>`;
}

export function renderLayoutMatchHtml(input: {
  layoutId?: string;
  layoutKind?: string;
  title: string;
  parts: ScriptPart[];
  look: BrandLook;
  fieldValues?: Record<string, string>;
}): string | null {
  const kind = resolveLayoutKind(input.layoutId, input.layoutKind);
  if (!kind) return null;

  const look = input.look;
  const fv = input.fieldValues ?? {};
  const parts = input.parts;
  const title = (fv.title || input.title || look.name).trim();
  const line =
    fv.subtitle ||
    parts.find((p) => p.body?.trim())?.body?.trim() ||
    parts[0]?.title ||
    '';
  const cta =
    fv.cta ||
    parts.find((p) => p.role === 'cta')?.title ||
    'Tìm hiểu thêm';
  const kicker = fv.kicker || look.name;
  const items = parts
    .map((p) => (p.title || p.body || '').trim())
    .filter(Boolean)
    .slice(0, 4);
  while (items.length < 3) items.push(`Ý ${items.length + 1}`);
  const date = fv.date || fv.eventDate || '12';
  const hours = fv.hours || '08:00 – 21:00';
  const price = fv.price || '990k';
  const oldPrice = fv.oldPrice || '1.490k';
  const sale = fv.sale || '−30%';
  const metric = fv.metric || fv.stat || '95%';
  const person = fv.recipient || fv.name || 'Nguyễn Văn A';
  const p = look.primary;
  const s = look.secondary;
  const a = look.accent;
  const bg = look.bg;
  const paper = look.surface;
  const ink = look.ink;
  const fg = look.text;
  const pad = 'padding:48px';

  let inner = '';
  switch (kind) {
    case 'pastel-hero':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <span style="width:fit-content;border-radius:999px;padding:8px 16px;background:${a};color:${bg};font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:14px">${esc(kicker)}</span>
        <h1 class="display" style="margin-top:28px;font-size:64px;line-height:.92;font-weight:800">${headlineAccent(title, a)}</h1>
        <p style="margin-top:16px;opacity:.72;max-width:36ch;font-size:20px">${esc(line)}</p>
        <span style="margin-top:auto;width:fit-content;border-radius:999px;padding:12px 22px;background:${p};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'knowledge':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:42px;font-weight:800">${esc(title)}</h1>
        <ul style="margin-top:28px;flex:1;list-style:none;display:flex;flex-direction:column;gap:16px">
          ${items
            .slice(0, 3)
            .map(
              (row, i) =>
                `<li style="display:flex;align-items:center;gap:12px;font-size:22px"><span style="font-weight:800;color:${a}">${String(i + 1).padStart(2, '0')}</span><span style="flex:1;height:1px;background:${ink};opacity:.2"></span><span>${esc(row)}</span></li>`
            )
            .join('')}
        </ul>
        <span style="margin-top:24px;width:fit-content;border-radius:8px;padding:10px 16px;background:${a};color:${bg};font-weight:700">Lưu bài</span>
      </div>`;
      break;
    case 'checklist':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:40px;font-weight:800">${esc(title)}</h1>
        <ul style="margin-top:24px;flex:1;list-style:none;display:flex;flex-direction:column;gap:18px;font-size:22px">
          ${items
            .slice(0, 4)
            .map(
              (row) =>
                `<li style="display:flex;gap:12px;align-items:center"><span style="width:22px;height:22px;border-radius:4px;background:${a};color:${bg};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">✓</span>${esc(row)}</li>`
            )
            .join('')}
        </ul>
      </div>`;
      break;
    case 'quote-center':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${paper};color:${ink}">
        <div style="font-size:96px;line-height:1;font-weight:800;color:${a};opacity:.35">“</div>
        <h1 class="display" style="font-size:36px;font-weight:700;max-width:18ch">${esc(title)}</h1>
        <p style="margin-top:20px;opacity:.6">— ${esc(look.name)}</p>
      </div>`;
      break;
    case 'event-date':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${p};color:${fg}">
        <span style="opacity:.8">${esc(kicker)}</span>
        <p class="display" style="margin-top:8px;font-size:120px;line-height:.85;font-weight:800">${esc(date.replace(/\D/g, '').slice(0, 2) || '12')}</p>
        <p style="font-weight:800;font-size:28px">${esc(fv.month || 'Tháng 9')}</p>
        <p style="margin-top:auto;font-size:22px">${esc(title)}</p>
        <span style="margin-top:12px;width:fit-content;border-radius:999px;padding:10px 18px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'photo-word':
      inner = `<div class="stage" style="position:relative;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(180deg,${p} 0%,${s} 42%,${bg} 100%)">
        <div style="position:absolute;left:48px;right:48px;top:64px;height:42%;border-radius:8px;background:${a};opacity:.3"></div>
        <div style="${pad};position:relative">
          <p class="display" style="font-size:88px;font-weight:800;line-height:.8;text-transform:uppercase">${esc((title.split(' ').pop() || title).slice(0, 12))}</p>
          <p style="margin-top:8px;opacity:.8">${esc(line)}</p>
        </div>
      </div>`;
      break;
    case 'magazine':
      inner = `<div class="stage" style="display:grid;grid-template-columns:1.3fr 1fr;min-height:100vh">
        <div style="${pad};display:flex;flex-direction:column;justify-content:flex-end;background:${p};color:${fg}">
          <h1 class="display" style="font-size:48px;font-weight:800;text-transform:uppercase;line-height:.85">${esc(title)}</h1>
        </div>
        <div style="${pad};display:flex;flex-direction:column;justify-content:space-between;background:${paper};color:${ink}">
          <span style="font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${a};font-size:12px">${esc(kicker)}</span>
          <p>${esc(line)}</p>
          <span style="font-weight:700">${esc(cta)} →</span>
        </div>
      </div>`;
      break;
    case 'offer-price':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <span style="width:fit-content;border-radius:6px;padding:6px 12px;background:${a};color:${bg};font-weight:800">${esc(sale)}</span>
        <h1 class="display" style="margin-top:16px;font-size:40px;font-weight:800">${esc(title)}</h1>
        <p class="display" style="margin-top:auto;font-size:72px;font-weight:800;color:${a}">${esc(price)}</p>
        <p style="text-decoration:line-through;opacity:.4">${esc(oldPrice)}</p>
        <span style="margin-top:12px;width:fit-content;border-radius:999px;padding:10px 18px;background:${p};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'product-split':
      inner = `<div class="stage" style="display:grid;grid-template-columns:1fr 1fr;min-height:100vh">
        <div style="background:linear-gradient(160deg,${p},${s})"></div>
        <div style="${pad};display:flex;flex-direction:column;justify-content:flex-end;background:${paper};color:${ink}">
          <h1 class="display" style="font-size:36px;font-weight:800">${esc(title)}</h1>
          <p style="margin-top:8px;opacity:.7">${esc(line)}</p>
          <span style="margin-top:16px;font-weight:800;color:${a}">${esc(cta)}</span>
        </div>
      </div>`;
      break;
    case 'menu-card':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:32px;font-weight:800">${esc(look.name)}</h1>
        <ul style="margin-top:20px;flex:1;list-style:none">
          ${items
            .slice(0, 3)
            .map(
              (row) =>
                `<li style="display:flex;justify-content:space-between;border-bottom:1px dashed ${ink}33;padding:10px 0;font-size:20px">${esc(row)}</li>`
            )
            .join('')}
        </ul>
        <span style="margin-top:16px;width:fit-content;border-radius:999px;padding:10px 16px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'hours-cta':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:36px;font-weight:800">${esc(look.name)}</h1>
        <p class="display" style="margin-top:16px;font-size:40px;font-weight:800">${esc(hours)}</p>
        <p style="margin-top:8px;opacity:.7">${esc(line || title)}</p>
        <span style="margin-top:24px;border-radius:999px;padding:12px 22px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'metric-hero':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:flex-end;background:${bg};color:${fg}">
        <p class="display" style="font-size:120px;line-height:.85;font-weight:800;color:${a}">${esc(metric)}</p>
        <h1 style="margin-top:8px;font-size:28px;font-weight:800">${esc(title)}</h1>
        <p style="opacity:.7">${esc(line)}</p>
      </div>`;
      break;
    case 'feature-ui':
    case 'land-soft':
      inner = `<div class="stage" style="display:grid;grid-template-columns:1fr 1fr;min-height:100vh;background:${paper};color:${ink}">
        <div style="${pad};display:flex;flex-direction:column;justify-content:center">
          <h1 class="display" style="font-size:40px;font-weight:800">${esc(title)}</h1>
          <span style="margin-top:16px;width:fit-content;border-radius:999px;padding:10px 18px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
        </div>
        <div style="margin:24px;border-radius:16px;border:1px solid ${ink}22;background:${bg};opacity:.12"></div>
      </div>`;
      break;
    case 'calm-tip':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <span style="width:fit-content;border-radius:999px;padding:6px 12px;background:${s};color:${bg};font-weight:800;text-transform:uppercase;font-size:12px">Mẹo</span>
        <h1 class="display" style="margin-top:24px;font-size:40px;font-weight:800">${esc(title)}</h1>
        <p style="margin-top:12px;opacity:.7">${esc(line)}</p>
        <span style="margin-top:auto;width:fit-content;border-radius:999px;padding:10px 16px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'trust-badge':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:36px;font-weight:800">${esc(title)}</h1>
        <div style="margin-top:28px;display:flex;gap:12px">${['ISO', 'Bộ Y tế', 'Phụ huynh']
          .map(
            (label) =>
              `<span style="width:72px;height:72px;border-radius:999px;border:2px solid ${a};display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:700">${esc(label)}</span>`
          )
          .join('')}</div>
        <p style="margin-top:auto;opacity:.7">${esc(line)}</p>
      </div>`;
      break;
    case 'story-white':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:56px;font-weight:800;line-height:.9">${esc(title)}</h1>
        <span style="margin-top:auto;border-radius:999px;padding:12px 22px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'story-pastel':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <span style="width:fit-content;border-radius:999px;padding:6px 12px;background:${a};color:${bg};font-weight:800;text-transform:uppercase;font-size:12px">${esc(kicker)}</span>
        <h1 class="display" style="margin-top:auto;font-size:56px;font-weight:800;line-height:.9">${headlineAccent(title, a)}</h1>
        <p style="margin-top:12px;opacity:.7">${esc(line)}</p>
      </div>`;
      break;
    case 'story-offer':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${p};color:${fg}">
        <span style="width:fit-content;border-radius:6px;padding:6px 12px;background:${a};color:${bg};font-weight:800">SALE</span>
        <p class="display" style="margin-top:auto;font-size:96px;line-height:.85;font-weight:800">${esc(sale)}</p>
        <p style="margin-top:12px">${esc(title)}</p>
        <span style="margin-top:12px;width:fit-content;border-radius:999px;padding:10px 18px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'car-cinematic':
      inner = `<div class="stage" style="display:flex;gap:8px;padding:12px;background:${bg};min-height:100vh">
        ${[p, s, a]
          .map(
            (c, i) =>
              `<div style="flex:1;border-radius:12px;padding:24px;display:flex;align-items:flex-end;background:${c};color:${fg}"><p class="display" style="font-size:28px;font-weight:800">${esc(['MỞ', 'Ý', 'CTA'][i] || title)}</p></div>`
          )
          .join('')}
      </div>`;
      break;
    case 'car-xhs':
      inner = `<div class="stage" style="display:flex;gap:8px;padding:12px;background:${paper};min-height:100vh">
        ${items
          .slice(0, 3)
          .map(
            (row, i) =>
              `<div style="flex:1;border-radius:12px;padding:20px;display:flex;flex-direction:column;background:${a}${i === 0 ? '33' : i === 1 ? '22' : '14'};color:${ink}"><span style="font-weight:800;color:${a};font-size:28px">${String(i + 1).padStart(2, '0')}</span><span style="margin-top:auto;font-weight:700">${esc(row)}</span></div>`
          )
          .join('')}
      </div>`;
      break;
    case 'vid-liquid':
      inner = `<div class="stage" style="position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:${bg};color:${fg}">
        <div style="position:absolute;left:-40px;top:16px;width:180px;height:180px;border-radius:999px;background:${p};opacity:.5;filter:blur(24px)"></div>
        <div style="position:absolute;right:0;bottom:32px;width:200px;height:200px;border-radius:999px;background:${a};opacity:.4;filter:blur(24px)"></div>
        <h1 class="display" style="position:relative;font-size:56px;font-weight:800">${esc(title)}</h1>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:10px 16px;background:${a};color:${bg};font-weight:700">${esc(line || cta)}</div>
      </div>`;
      break;
    case 'vid-cursor':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:center;background:${bg};color:${fg}">
        <h1 class="display" style="font-size:56px;font-weight:800;line-height:.95">${esc(title)}<span style="display:inline-block;width:6px;height:.85em;margin-left:6px;background:${a};vertical-align:middle"></span></h1>
        <p style="margin-top:20px;letter-spacing:.35em;opacity:.6;font-size:12px">SCRAMBLE</p>
      </div>`;
      break;
    case 'vid-kinetic':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:center;background:${bg};color:${fg}">
        <h1 class="display" style="font-size:64px;font-weight:800;text-transform:uppercase;line-height:.85;white-space:pre-line">${esc(title.split(' ').slice(0, 4).join('\n'))}</h1>
      </div>`;
      break;
    case 'vid-stat':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:center;background:${bg};color:${fg}">
        <p class="display" style="font-size:120px;line-height:.85;font-weight:800;color:${a}">${esc(metric.replace('%', '') || '3')}</p>
        <h1 style="margin-top:12px;font-size:32px;font-weight:800">${esc(title)}</h1>
      </div>`;
      break;
    case 'vid-warm':
      inner = `<div class="stage" style="${pad};display:flex;align-items:flex-end;background:linear-gradient(180deg,${s},${bg});color:${fg}">
        <h1 class="display" style="max-width:16ch;font-size:48px;font-weight:800">${esc(title)}</h1>
      </div>`;
      break;
    case 'poster-sketch':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:44px;font-weight:800">${esc(title)}</h1>
        <div style="margin-top:24px;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div style="border:3px dashed ${a};border-radius:999px;opacity:.6"></div>
          <p>${esc(line)}</p>
        </div>
      </div>`;
      break;
    case 'poster-mag':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:space-between;background:${p};color:${fg}">
        <span style="text-transform:uppercase;letter-spacing:.2em;opacity:.7">${esc(kicker)}</span>
        <h1 class="display" style="font-size:64px;font-weight:800;text-transform:uppercase;line-height:.85">${esc(title)}</h1>
        <span>${esc(cta)}</span>
      </div>`;
      break;
    case 'poster-hero':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:space-between;background:${p};color:${fg}">
        <p class="display" style="font-size:80px;font-weight:800">${esc(fv.date || '12.09')}</p>
        <h1 class="display" style="font-size:40px;font-weight:800;text-transform:uppercase;line-height:.9">${esc(title)}</h1>
        <span>${esc(cta)}</span>
      </div>`;
      break;
    case 'deck-launch':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;justify-content:space-between;background:${bg};color:${fg}">
        <span style="color:${a}">01 / COVER</span>
        <h1 class="display" style="max-width:16ch;font-size:56px;font-weight:800;line-height:.95">${esc(title)}</h1>
        <span>${esc(look.name)}</span>
      </div>`;
      break;
    case 'deck-swiss':
      inner = `<div class="stage" style="display:grid;grid-template-columns:1fr 1fr;min-height:100vh;background:${paper};color:${ink}">
        <div style="${pad};border-right:1px solid ${ink}22"><h1 class="display" style="font-size:40px;font-weight:800">${esc(title)}</h1></div>
        <div style="${pad}">${items
          .slice(0, 3)
          .map((row) => `<p style="margin-bottom:12px">— ${esc(row)}</p>`)
          .join('')}</div>
      </div>`;
      break;
    case 'deck-course':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <span style="color:${a}">BUỔI 03</span>
        <h1 class="display" style="margin-top:8px;font-size:40px;font-weight:800">${esc(title)}</h1>
        <ul style="margin-top:auto;list-style:none">${items
          .slice(0, 3)
          .map((row) => `<li style="margin-top:8px">— ${esc(row)}</li>`)
          .join('')}</ul>
      </div>`;
      break;
    case 'info-dash':
      inner = `<div class="stage" style="${pad};display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;background:${bg}">
        ${(fv.stats ? fv.stats.split(/[,|]/) : items.slice(0, 4).length ? items.slice(0, 4) : ['1.2k', '95%', '12', '4.9'])
          .slice(0, 4)
          .map(
            (n, i) =>
              `<div style="border-radius:12px;padding:20px;display:flex;flex-direction:column;justify-content:flex-end;background:${i === 0 ? p : paper};color:${i === 0 ? fg : ink}"><p class="display" style="font-size:40px;font-weight:800">${esc(n)}</p><p style="opacity:.7">Chỉ số</p></div>`
          )
          .join('')}
      </div>`;
      break;
    case 'land-saas':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${bg};color:${fg}">
        <h1 class="display" style="max-width:16ch;font-size:44px;font-weight:800">${esc(title)}</h1>
        <div style="margin-top:auto;height:42%;border-radius:12px;background:${paper};opacity:.15"></div>
      </div>`;
      break;
    case 'event-wait':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${paper};color:${ink}">
        <span style="font-weight:800;letter-spacing:.2em;text-transform:uppercase;font-size:12px">${esc(look.name)}</span>
        <h1 class="display" style="margin-top:12px;font-size:40px;font-weight:800">${esc(title)}</h1>
        <p style="margin-top:8px;opacity:.7">${esc(fv.datetime || hours)}</p>
        <span style="margin-top:16px;border-radius:999px;padding:10px 18px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
      break;
    case 'sheet-doc':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 class="display" style="font-size:36px;font-weight:800">${esc(title)}</h1>
        <p style="margin-top:16px;line-height:1.6">${esc(line)}</p>
        ${items.map((row) => `<p style="margin-top:12px">— ${esc(row)}</p>`).join('')}
      </div>`;
      break;
    case 'sheet-email':
      inner = `<div class="stage" style="display:flex;flex-direction:column;min-height:100vh;background:#e2e8f0">
        <div style="padding:20px 32px;background:${p};color:${fg}"><h1 style="font-size:24px;font-weight:800">${esc(title)}</h1></div>
        <div style="margin:16px;flex:1;padding:32px;background:#fff;color:${ink};border-radius:8px">
          <p>${esc(line)}</p>
          <span style="display:inline-block;margin-top:20px;border-radius:6px;padding:10px 16px;background:${a};color:${bg};font-weight:700">${esc(cta)}</span>
        </div>
      </div>`;
      break;
    case 'sheet-brochure':
      inner = `<div class="stage" style="display:grid;grid-template-columns:1fr 1fr 1fr;min-height:100vh;gap:2px;background:${ink}">
        ${[p, paper, paper]
          .map(
            (c, i) =>
              `<div style="padding:28px;display:flex;flex-direction:column;justify-content:flex-end;background:${c};color:${i === 0 ? fg : ink}"><p style="font-weight:800">${esc(['Bìa', 'Lợi ích', 'Liên hệ'][i] || '')}</p><p style="margin-top:8px">${esc(i === 0 ? title : items[i] || line)}</p></div>`
          )
          .join('')}
      </div>`;
      break;
    case 'cert-formal':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:${paper};color:${ink};border:16px solid ${a}">
        <p style="letter-spacing:.3em;text-transform:uppercase;font-size:14px">Chứng nhận</p>
        <h1 class="display" style="margin-top:16px;font-size:48px;font-weight:800">${esc(person)}</h1>
        <p style="margin-top:12px">${esc(line || title)}</p>
      </div>`;
      break;
    case 'resume-col':
      inner = `<div class="stage" style="display:grid;grid-template-columns:.8fr 1.2fr;min-height:100vh;color:${ink}">
        <div style="${pad};background:${p};color:${fg}"><p style="font-weight:800">${esc(person)}</p><p style="margin-top:16px;opacity:.75">${esc(look.name)}</p></div>
        <div style="${pad};background:${paper}"><h1 style="font-weight:800">${esc(title)}</h1><p style="margin-top:16px">${esc(line)}</p></div>
      </div>`;
      break;
    case 'worksheet':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 style="font-weight:800;font-size:28px">${esc(title)}</h1>
        ${items
          .slice(0, 3)
          .map(
            (row, i) =>
              `<div style="margin-top:24px"><p>Câu ${i + 1}. ${esc(row)}</p><div style="margin-top:8px;height:1px;background:${ink};opacity:.3"></div></div>`
          )
          .join('')}
      </div>`;
      break;
    case 'quiz':
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <h1 style="font-weight:800">Câu 1. ${esc(title)}?</h1>
        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
          ${['A', 'B', 'C']
            .map(
              (opt, i) =>
                `<div style="display:flex;gap:10px;align-items:center;border:1px solid ${ink}22;border-radius:8px;padding:10px 14px"><span style="font-weight:800;color:${a}">${opt}</span>${esc(items[i] || `Đáp án ${opt}`)}</div>`
            )
            .join('')}
        </div>
      </div>`;
      break;
    default:
      inner = `<div class="stage" style="${pad};display:flex;flex-direction:column;background:${paper};color:${ink}">
        <span style="width:fit-content;border-radius:999px;padding:8px 16px;background:${a};color:${bg};font-weight:800">${esc(kicker)}</span>
        <h1 class="display" style="margin-top:24px;font-size:56px;font-weight:800">${headlineAccent(title, a)}</h1>
        <p style="margin-top:12px;opacity:.72">${esc(line)}</p>
        <span style="margin-top:auto;width:fit-content;border-radius:999px;padding:12px 22px;background:${p};color:${bg};font-weight:700">${esc(cta)}</span>
      </div>`;
  }

  return wrap(look, inner);
}
