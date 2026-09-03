import fs from 'fs';
import path from 'path';

const OPEN_DESIGN_SYSTEMS = path.resolve(
  __dirname,
  '../../tools/open-design/design-systems'
);

export interface BrandLook {
  name: string
  primary: string
  secondary: string
  accent: string
  bg: string
  text: string
  surface: string
  ink: string
  muted: string
}

export interface BrandPaletteInput {
  name?: string
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  text?: string
}

const PRESETS: Record<string, BrandLook> = {
  'viet-my-college': {
    name: 'Việt Mỹ College',
    primary: '#1d4ed8',
    secondary: '#0ea5e9',
    accent: '#f59e0b',
    bg: '#0f172a',
    text: '#f8fafc',
    surface: '#f8fafc',
    ink: '#0f172a',
    muted: '#475569',
  },
  'tram-thanh-xuan': {
    name: 'Trạm Thanh Xuân',
    primary: '#b45309',
    secondary: '#fbbf24',
    accent: '#10b981',
    bg: '#1c1917',
    text: '#fafaf9',
    surface: '#fffbeb',
    ink: '#1c1917',
    muted: '#78716c',
  },
  'default-neutral': {
    name: 'LYON Studio',
    primary: '#64748b',
    secondary: '#94a3b8',
    accent: '#22d3ee',
    bg: '#020617',
    text: '#f1f5f9',
    surface: '#f8fafc',
    ink: '#0f172a',
    muted: '#64748b',
  },
  'edu-stem-lab': {
    name: 'STEM Lab Edu',
    primary: '#7c3aed',
    secondary: '#06b6d4',
    accent: '#22c55e',
    bg: '#0b1020',
    text: '#e2e8f0',
    surface: '#f5f3ff',
    ink: '#1e1b4b',
    muted: '#5b21b6',
  },
  'shop-local-mart': {
    name: 'Local Mart',
    primary: '#dc2626',
    secondary: '#f97316',
    accent: '#2563eb',
    bg: '#111827',
    text: '#f9fafb',
    surface: '#fff7ed',
    ink: '#111827',
    muted: '#9a3412',
  },
}

function hex(value?: string): string | undefined {
  const match = value?.trim().match(/#?[0-9a-fA-F]{6}/)
  if (!match) return undefined
  return match[0].startsWith('#') ? match[0] : `#${match[0]}`
}

function namedHex(prompt: string, label: string): string | undefined {
  const match = prompt.match(
    new RegExp(`${label}\\s*[#:]*\\s*(#[0-9a-fA-F]{6})`, 'i')
  )
  return match?.[1]
}

function tokenHex(css: string, name: string): string | undefined {
  const match = css.match(
    new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{3,8})`, 'i')
  )
  return hex(match?.[1])
}

/** Đọc tokens.css từ open-design/design-systems/<id>. */
export function lookFromOpenDesign(brandId?: string): BrandLook | null {
  if (!brandId?.trim()) return null
  const folder = path.join(OPEN_DESIGN_SYSTEMS, brandId)
  const tokensPath = path.join(folder, 'tokens.css')
  if (!fs.existsSync(tokensPath)) return null
  try {
    const css = fs.readFileSync(tokensPath, 'utf-8')
    const designMd = path.join(folder, 'DESIGN.md')
    let name = brandId
    if (fs.existsSync(designMd)) {
      const h1 = fs.readFileSync(designMd, 'utf-8').match(/^#\s+(.+)$/m)
      if (h1?.[1]) {
        name = h1[1].replace(/^Design System Inspired by\s+/i, '').trim()
      }
    }
    const accent = tokenHex(css, 'accent')
    const bg = tokenHex(css, 'bg')
    const fg = tokenHex(css, 'fg')
    if (!accent && !bg) return null
    return {
      name,
      primary: accent || '#5e6ad2',
      secondary: tokenHex(css, 'accent-hover') || accent || '#7170ff',
      accent: accent || '#5e6ad2',
      bg: bg || '#08090a',
      text: fg || '#f7f8f8',
      surface: tokenHex(css, 'surface') || '#191a1b',
      ink: bg || '#0f172a',
      muted: tokenHex(css, 'muted') || '#8a8f98',
    }
  } catch {
    return null
  }
}

export function bareHex(value: string): string {
  return value.replace('#', '').toLowerCase()
}

export function resolveBrandLook(input: {
  brandId?: string
  prompt?: string
  palette?: BrandPaletteInput | null
}): BrandLook {
  const od = lookFromOpenDesign(input.brandId)
  const preset = input.brandId ? PRESETS[input.brandId] : undefined
  const text = input.prompt ?? ''
  const name =
    input.palette?.name?.trim() ||
    text.match(/Tên:\s*(.+)/)?.[1]?.trim().slice(0, 48) ||
    od?.name ||
    preset?.name ||
    'LYON Studio'

  const base: BrandLook = od ?? preset ?? PRESETS['default-neutral']
  return {
    name,
    primary:
      hex(input.palette?.primary) ||
      namedHex(text, 'chính') ||
      base.primary,
    secondary:
      hex(input.palette?.secondary) ||
      namedHex(text, 'phụ') ||
      base.secondary,
    accent:
      hex(input.palette?.accent) ||
      namedHex(text, 'nhấn') ||
      base.accent,
    bg:
      hex(input.palette?.background) ||
      namedHex(text, 'nền') ||
      base.bg,
    text: hex(input.palette?.text) || namedHex(text, 'chữ') || base.text,
    surface:
      hex(input.palette?.background) ||
      namedHex(text, 'nền') ||
      base.surface,
    ink: hex(input.palette?.text) || namedHex(text, 'chữ') || base.ink,
    muted: base.muted,
  }
}
