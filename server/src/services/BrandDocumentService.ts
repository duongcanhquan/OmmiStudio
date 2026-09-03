import type { VideoScript } from './LLMService';
import type { ScriptPart } from './scriptForm';

const LOOKS: Record<
  string,
  { name: string; bg: string; text: string; accent: string; secondary: string }
> = {
  'viet-my-college': {
    name: 'Việt Mỹ College',
    bg: '#0f172a',
    text: '#f8fafc',
    accent: '#f59e0b',
    secondary: '#0ea5e9',
  },
  'tram-thanh-xuan': {
    name: 'Trạm Thanh Xuân',
    bg: '#1c1917',
    text: '#fafaf9',
    accent: '#10b981',
    secondary: '#fbbf24',
  },
  'default-neutral': {
    name: 'OmniStudio',
    bg: '#020617',
    text: '#f1f5f9',
    accent: '#22d3ee',
    secondary: '#94a3b8',
  },
  'edu-stem-lab': {
    name: 'STEM Lab Edu',
    bg: '#0b1020',
    text: '#e2e8f0',
    accent: '#22c55e',
    secondary: '#06b6d4',
  },
  'shop-local-mart': {
    name: 'Local Mart',
    bg: '#111827',
    text: '#f9fafb',
    accent: '#2563eb',
    secondary: '#f97316',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function namedHex(prompt: string, label: string): string | undefined {
  const match = prompt.match(
    new RegExp(`${label}\\s*[#:]*\\s*(#[0-9a-fA-F]{6})`, 'i')
  );
  return match?.[1];
}

export function resolveDocumentLook(brandId?: string, prompt?: string) {
  const fromId = brandId ? LOOKS[brandId] : undefined;
  const text = prompt ?? '';
  const name =
    text.match(/Tên:\s*(.+)/)?.[1]?.trim().slice(0, 48) ||
    fromId?.name ||
    'OmniStudio';
  return {
    name,
    bg: namedHex(text, 'nền') || fromId?.bg || '#0b1220',
    text: namedHex(text, 'chữ') || fromId?.text || '#f8fafc',
    accent: namedHex(text, 'nhấn') || fromId?.accent || '#22d3ee',
    secondary: namedHex(text, 'phụ') || fromId?.secondary || '#94a3b8',
  };
}

export function buildBrandedHtml(input: {
  title: string;
  parts: ScriptPart[];
  script?: VideoScript;
  prompt?: string;
  brandId?: string;
  mode: 'slides' | 'poster' | 'print';
}): string {
  const look = resolveDocumentLook(input.brandId, input.prompt);
  const blocks =
    input.parts.length > 0
      ? input.parts
      : (input.script?.scenes ?? []).map((scene, index) => ({
          id: `scene-${index + 1}`,
          role: 'body' as const,
          title: scene.visualText,
          body: scene.voiceoverText,
          notes: '',
        }));

  const sections = blocks
    .map(
      (part, index) => `
    <section class="block" data-role="${escapeHtml(part.role)}">
      <p class="kicker">${escapeHtml(look.name)} · ${index + 1}/${blocks.length}</p>
      <h2>${escapeHtml(part.title || `Phần ${index + 1}`)}</h2>
      ${part.body ? `<p class="body">${escapeHtml(part.body).replace(/\n/g, '<br/>')}</p>` : ''}
      ${part.notes ? `<p class="notes">${escapeHtml(part.notes)}</p>` : ''}
    </section>`
    )
    .join('\n');

  const page =
    input.mode === 'print'
      ? '210mm 297mm'
      : input.mode === 'poster'
        ? 'auto'
        : 'auto';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(input.title || look.name)}</title>
  <style>
    @page { size: ${page}; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Arial Unicode MS", Arial, sans-serif;
      background: ${look.bg};
      color: ${look.text};
    }
    header {
      padding: 28px 36px 12px;
      border-bottom: 4px solid ${look.accent};
    }
    header p { margin: 0; color: ${look.secondary}; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
    header h1 { margin: 8px 0 0; font-size: 32px; line-height: 1.2; }
    main { padding: 12px 0 48px; }
    .block {
      min-height: ${input.mode === 'slides' ? '70vh' : 'auto'};
      padding: 36px;
      border-bottom: 1px solid ${look.secondary}33;
      page-break-after: ${input.mode === 'print' ? 'always' : 'auto'};
    }
    .kicker { margin: 0 0 10px; color: ${look.secondary}; font-size: 12px; }
    h2 { margin: 0 0 12px; font-size: ${input.mode === 'poster' ? '42px' : '28px'}; }
    .body { margin: 0; font-size: 18px; line-height: 1.55; max-width: 42rem; }
    .notes { margin: 12px 0 0; color: ${look.secondary}; font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <p>${escapeHtml(look.name)}</p>
    <h1>${escapeHtml(input.title || look.name)}</h1>
  </header>
  <main>${sections}</main>
</body>
</html>`;
}
