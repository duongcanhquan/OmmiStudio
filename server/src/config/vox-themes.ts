/** Đồng bộ `client/src/lib/voxThemes.ts` — theme cắt giấy vox-director. */

export type VoxThemeId =
  | 'american-retro'
  | 'swiss-modern'
  | 'punk-zine'
  | 'soviet-constructivist'
  | 'wpa-propaganda'
  | '70s-groovy'
  | 'chinese-ink'
  | 'atomic-age'
  | 'newsprint-editorial'
  | 'gilded-deco';

export type VoxLayoutKind =
  | 'vox-american-retro'
  | 'vox-swiss-modern'
  | 'vox-punk-zine'
  | 'vox-soviet'
  | 'vox-wpa'
  | 'vox-70s'
  | 'vox-ink'
  | 'vox-atomic'
  | 'vox-newsprint'
  | 'vox-deco'
  | 'vox-listicle'
  | 'vox-timeline'
  | 'vox-stat'
  | 'vox-hook';

export type VoxComposition =
  | 'hero'
  | 'grid'
  | 'diagonal'
  | 'columns'
  | 'list'
  | 'timeline'
  | 'stat'
  | 'seal';

export type VoxTexture = 'halftone' | 'grain' | 'xerox' | 'rice' | 'foil';

export interface VoxTheme {
  id: VoxThemeId;
  kind: VoxLayoutKind;
  name: string;
  blurb: string;
  era: string;
  bg: string;
  paper: string;
  ink: string;
  accent: string;
  secondary: string;
  display: string;
  body: string;
  texture: VoxTexture;
  motion: 'punchy' | 'calm';
  composition: VoxComposition;
}

export const VOX_THEMES: Record<VoxThemeId, VoxTheme> = {
  'american-retro': {
    id: 'american-retro',
    kind: 'vox-american-retro',
    name: 'Mỹ retro / pulp',
    blurb: 'Chữ gỗ đậm · burst · chấm halftone — quảng cáo / thể thao',
    era: '1950s US ad',
    bg: '#c41e3a',
    paper: '#f4e4c1',
    ink: '#1a1208',
    accent: '#f4c430',
    secondary: '#1d4e89',
    display: '"Archivo Black", Impact, sans-serif',
    body: '"Special Elite", "Courier New", monospace',
    texture: 'halftone',
    motion: 'punchy',
    composition: 'hero',
  },
  'swiss-modern': {
    id: 'swiss-modern',
    kind: 'vox-swiss-modern',
    name: 'Swiss / lưới sạch',
    blurb: 'Hai màu + đỏ · Helvetica · nhiều khoảng trống',
    era: 'Swiss International',
    bg: '#f2f0ea',
    paper: '#ffffff',
    ink: '#111111',
    accent: '#e10600',
    secondary: '#111111',
    display: 'Helvetica, "Arial Narrow", sans-serif',
    body: 'Helvetica, Arial, sans-serif',
    texture: 'grain',
    motion: 'calm',
    composition: 'grid',
  },
  'punk-zine': {
    id: 'punk-zine',
    kind: 'vox-punk-zine',
    name: 'Zine punk photocopy',
    blurb: 'Đen trắng + một màu điểm · chữ cắt ransom',
    era: '90s punk DIY',
    bg: '#111111',
    paper: '#f3f0e7',
    ink: '#111111',
    accent: '#ff2d55',
    secondary: '#f3f0e7',
    display: '"Anton", Impact, sans-serif',
    body: '"Courier New", monospace',
    texture: 'xerox',
    motion: 'punchy',
    composition: 'hero',
  },
  'soviet-constructivist': {
    id: 'soviet-constructivist',
    kind: 'vox-soviet',
    name: 'Kiến tạo Xô viết',
    blurb: 'Đỏ / đen / kem · thanh chéo · chữ đặc',
    era: 'Russian Constructivism',
    bg: '#f3e6c9',
    paper: '#f8eed8',
    ink: '#141414',
    accent: '#c8102e',
    secondary: '#141414',
    display: '"Archivo Black", "Arial Black", sans-serif',
    body: 'Arial, sans-serif',
    texture: 'halftone',
    motion: 'punchy',
    composition: 'diagonal',
  },
  'wpa-propaganda': {
    id: 'wpa-propaganda',
    kind: 'vox-wpa',
    name: 'Áp phích WPA',
    blurb: 'Ba màu trầm · stencil · in lụa — lịch sử / y tế công',
    era: '1930s WPA',
    bg: '#2f4a3c',
    paper: '#d8c4a0',
    ink: '#1f1a12',
    accent: '#c45c26',
    secondary: '#5b6b4a',
    display: '"Bebas Neue", Impact, sans-serif',
    body: 'Georgia, serif',
    texture: 'grain',
    motion: 'calm',
    composition: 'hero',
  },
  '70s-groovy': {
    id: '70s-groovy',
    kind: 'vox-70s',
    name: '70s groovy',
    blurb: 'Mù tạt / gỉ / bơ · serif phồng · hạt riso',
    era: '1970s',
    bg: '#c4a35a',
    paper: '#f3e2b8',
    ink: '#3b1f12',
    accent: '#b33a1a',
    secondary: '#6b7a3a',
    display: '"Playfair Display", Georgia, serif',
    body: 'Georgia, serif',
    texture: 'grain',
    motion: 'punchy',
    composition: 'hero',
  },
  'chinese-ink': {
    id: 'chinese-ink',
    kind: 'vox-ink',
    name: 'Mực tàu / ấn son',
    blurb: 'Giấy dó · chữ lớn · ấn đỏ — văn hóa / lịch sử',
    era: 'Woodblock / ink',
    bg: '#ebe4d4',
    paper: '#f7f1e3',
    ink: '#1a1a1a',
    accent: '#c41a1a',
    secondary: '#6b5a3e',
    display: '"Noto Serif SC", "Songti SC", serif',
    body: '"Noto Serif SC", Georgia, serif',
    texture: 'rice',
    motion: 'calm',
    composition: 'seal',
  },
  'atomic-age': {
    id: 'atomic-age',
    kind: 'vox-atomic',
    name: 'Atomic age',
    blurb: 'Xanh teal / cam · boomerang · khoa học / tương lai',
    era: '1950s futurism',
    bg: '#0f3d4c',
    paper: '#f3ead2',
    ink: '#0f3d4c',
    accent: '#e85d04',
    secondary: '#2a9d8f',
    display: '"Bebas Neue", "Trebuchet MS", sans-serif',
    body: '"Trebuchet MS", sans-serif',
    texture: 'halftone',
    motion: 'punchy',
    composition: 'hero',
  },
  'newsprint-editorial': {
    id: 'newsprint-editorial',
    kind: 'vox-newsprint',
    name: 'Bìa báo editorial',
    blurb: 'Masthead · cột tin · headline đặc — explainer Vox',
    era: 'Mid-century news',
    bg: '#e7dcc4',
    paper: '#f4ead4',
    ink: '#2b2118',
    accent: '#9b1d20',
    secondary: '#c9a227',
    display: '"Archivo Black", "Times New Roman", serif',
    body: '"Special Elite", Georgia, serif',
    texture: 'halftone',
    motion: 'punchy',
    composition: 'columns',
  },
  'gilded-deco': {
    id: 'gilded-deco',
    kind: 'vox-deco',
    name: 'Art deco mạ vàng',
    blurb: 'Kem / vàng champagne · Didone · hàng xa xỉ',
    era: '1920s Art Deco',
    bg: '#1c1914',
    paper: '#efe4c8',
    ink: '#1c1914',
    accent: '#c9a227',
    secondary: '#8c7340',
    display: '"Playfair Display", Didot, serif',
    body: 'Georgia, serif',
    texture: 'foil',
    motion: 'calm',
    composition: 'hero',
  },
};

export const VOX_KIND_THEME: Record<VoxLayoutKind, VoxThemeId> = {
  'vox-american-retro': 'american-retro',
  'vox-swiss-modern': 'swiss-modern',
  'vox-punk-zine': 'punk-zine',
  'vox-soviet': 'soviet-constructivist',
  'vox-wpa': 'wpa-propaganda',
  'vox-70s': '70s-groovy',
  'vox-ink': 'chinese-ink',
  'vox-atomic': 'atomic-age',
  'vox-newsprint': 'newsprint-editorial',
  'vox-deco': 'gilded-deco',
  'vox-listicle': 'newsprint-editorial',
  'vox-timeline': 'american-retro',
  'vox-stat': 'swiss-modern',
  'vox-hook': 'punk-zine',
};

export const VOX_KIND_COMPOSITION: Partial<
  Record<VoxLayoutKind, VoxComposition>
> = {
  'vox-listicle': 'list',
  'vox-timeline': 'timeline',
  'vox-stat': 'stat',
  'vox-hook': 'hero',
};

export function isVoxLayoutKind(kind?: string): kind is VoxLayoutKind {
  return Boolean(kind && kind in VOX_KIND_THEME);
}

export function themeForKind(kind: VoxLayoutKind): VoxTheme {
  return VOX_THEMES[VOX_KIND_THEME[kind]];
}

export function compositionForKind(kind: VoxLayoutKind): VoxComposition {
  return VOX_KIND_COMPOSITION[kind] ?? themeForKind(kind).composition;
}
