import fs from 'fs/promises';
import path from 'path';

export type TemplateType =
  | 'deck'
  | 'poster'
  | 'video'
  | 'social'
  | 'document'
  | 'landing'
  | 'newsletter'
  | 'infographic'
  | 'certificate'
  | 'resume'
  | 'brochure'
  | 'event'
  | 'worksheet'
  | 'quiz';

export type MotionCategory =
  | 'kinetic-text'
  | 'entrances'
  | 'backgrounds'
  | 'transitions';

export interface TemplateMeta {
  id: string;
  name: string;
  /** Normalized content surface for the Studio gallery filters */
  type: TemplateType;
  thumbnail?: string | null;
  description?: string;
  mode?: string;
  scenario?: string;
  surface?: string;
  path: string;
}

export interface BrandMeta {
  id: string;
  name: string;
  description?: string;
  /** Optional accent hint for UI tiles */
  accent?: string;
  path: string;
}

export interface MotionRecipe {
  id: string;
  name: string;
  category: MotionCategory;
  categoryLabel: string;
  description?: string;
  /** Tag used in HTML data-motion / LLM motionType */
  motionType: string;
}

const TOOLS_ROOT = path.resolve(__dirname, '../../tools');

/** Known html-anything skill roots (first existing wins as primary scan root). */
const TEMPLATE_CANDIDATE_DIRS = [
  path.join(
    TOOLS_ROOT,
    'html-anything',
    'next',
    'src',
    'lib',
    'templates',
    'skills'
  ),
  path.join(TOOLS_ROOT, 'html-anything', 'templates'),
  path.join(TOOLS_ROOT, 'html-anything', 'skills'),
];

/** Known open-design brand pack roots. */
const BRAND_CANDIDATE_DIRS = [
  path.join(TOOLS_ROOT, 'open-design', 'design-systems'),
  path.join(TOOLS_ROOT, 'open-design', 'packages', 'design-systems'),
];

/** motion-anything recipe / preset folders (optional scan). */
const MOTION_CANDIDATE_DIRS = [
  path.join(TOOLS_ROOT, 'motion-anything', 'recipes'),
  path.join(TOOLS_ROOT, 'motion-anything', 'presets'),
  path.join(TOOLS_ROOT, 'motion-anything', 'motions'),
  path.join(TOOLS_ROOT, 'motion-anything', 'src', 'recipes'),
];

const THUMBNAIL_NAMES = [
  'thumbnail.png',
  'thumbnail.jpg',
  'thumbnail.webp',
  'preview.png',
  'preview.jpg',
  'cover.png',
  'cover.jpg',
  'thumb.png',
];

/** Mẫu dự phòng khi chưa clone tools — tên & mô tả tiếng Việt */
const FALLBACK_TEMPLATES: TemplateMeta[] = [
  {
    id: 'deck-giao-trinh',
    name: 'Giáo trình Thuyết trình',
    type: 'deck',
    description: 'Slide bài giảng hiện đại cho giáo viên',
    mode: 'deck',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'deck-orientation-sinh-vien',
    name: 'Orientation Sinh viên Mới',
    type: 'deck',
    description: 'Deck giới thiệu trường / khoa cho tân sinh viên',
    mode: 'deck',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'deck-pitch-startup',
    name: 'Pitch Deck Startup',
    type: 'deck',
    description: 'Thuyết trình gọi vốn / giới thiệu sản phẩm',
    mode: 'deck',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'poster-su-kien-neon',
    name: 'Poster Sự kiện Neon',
    type: 'poster',
    description: 'Poster quảng bá sự kiện, tông màu nổi bật',
    mode: 'frame',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'poster-tuyen-sinh',
    name: 'Poster Tuyển sinh',
    type: 'poster',
    description: 'Ấn phẩm tuyển sinh / open day',
    mode: 'frame',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'video-gioi-thieu-truong',
    name: 'Video Giới thiệu Trường',
    type: 'video',
    description: 'Video brand story có voiceover tiếng Việt',
    mode: 'video',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'video-reels-social',
    name: 'Video Reels / Short',
    type: 'video',
    description: 'Storyboard dọc cho TikTok, Reels, Shorts',
    mode: 'video',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'social-instagram-carousel',
    name: 'Carousel Instagram',
    type: 'social',
    description: 'Bộ slide vuông cho bài đăng carousel',
    mode: 'social',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'social-facebook-cover',
    name: 'Facebook Cover & Post',
    type: 'social',
    description: 'Ảnh bìa và bài đăng quảng bá',
    mode: 'social',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'document-bao-cao',
    name: 'Báo cáo / Memo',
    type: 'document',
    description: 'Tài liệu dài dạng chương / section',
    mode: 'doc',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'landing-san-pham',
    name: 'Landing Page Sản phẩm',
    type: 'landing',
    description: 'Trang đích giới thiệu khóa học / dịch vụ',
    mode: 'prototype',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'newsletter-email',
    name: 'Bản tin Email',
    type: 'newsletter',
    description: 'Newsletter HTML cho phụ huynh / học viên',
    mode: 'newsletter',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'infographic-thong-ke',
    name: 'Infographic Thống kê',
    type: 'infographic',
    description: 'Sơ đồ số liệu, timeline, quy trình',
    mode: 'infographic',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'certificate-giay-khen',
    name: 'Giấy khen / Chứng chỉ',
    type: 'certificate',
    description: 'Chứng nhận hoàn thành, giấy khen học sinh',
    mode: 'certificate',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'resume-cv-giao-vien',
    name: 'CV Giáo viên / Marketer',
    type: 'resume',
    description: 'Hồ sơ năng lực một trang A4',
    mode: 'resume',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'brochure-to-roi',
    name: 'Brochure / Tờ rơi',
    type: 'brochure',
    description: 'Tờ quảng cáo gấp, giới thiệu chương trình',
    mode: 'brochure',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'event-thu-moi',
    name: 'Thiệp mời Sự kiện',
    type: 'event',
    description: 'Lễ tốt nghiệp, hội thảo, workshop',
    mode: 'event',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'worksheet-phieu-hoc-tap',
    name: 'Phiếu Bài tập',
    type: 'worksheet',
    description: 'Worksheet in-class cho học sinh',
    mode: 'worksheet',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'quiz-trac-nghiem',
    name: 'Quiz Trắc nghiệm',
    type: 'quiz',
    description: 'Bộ câu hỏi ôn tập / kiểm tra nhanh',
    mode: 'quiz',
    path: '(fallback)',
    thumbnail: null,
  },
  {
    id: 'deck-swiss-international',
    name: 'Swiss International (EN)',
    type: 'deck',
    description: 'Mẫu quốc tế tối giản — từ html-anything',
    mode: 'deck',
    path: '(fallback)',
    thumbnail: null,
  },
];

const FALLBACK_BRANDS: BrandMeta[] = [
  {
    id: 'viet-my-college',
    name: 'Việt Mỹ College',
    description: 'Bộ nhận diện giáo dục',
    accent: '#2563eb',
    path: '(fallback)',
  },
  {
    id: 'tram-thanh-xuan',
    name: 'Trạm Thanh Xuân',
    description: 'Thương hiệu địa phương / hospitality',
    accent: '#f59e0b',
    path: '(fallback)',
  },
  {
    id: 'default-neutral',
    name: 'Mặc định Trung tính',
    description: 'Hệ màu sạch khi chưa có DESIGN.md',
    accent: '#94a3b8',
    path: '(fallback)',
  },
];

const BUILTIN_MOTIONS: MotionRecipe[] = [
  {
    id: 'typewriter',
    name: 'Máy đánh chữ',
    category: 'kinetic-text',
    categoryLabel: 'Chữ động',
    description: 'Hiện từng ký tự — phù hợp nội dung dài',
    motionType: 'typewriter',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    category: 'kinetic-text',
    categoryLabel: 'Chữ động',
    description: 'Hiệu ứng nhiễu số — tiêu đề nổi bật',
    motionType: 'glitch',
  },
  {
    id: 'fade-in',
    name: 'Mờ dần vào',
    category: 'entrances',
    categoryLabel: 'Xuất hiện',
    description: 'Fade in nhẹ nhàng',
    motionType: 'fade-in',
  },
  {
    id: 'slide-up',
    name: 'Trượt lên',
    category: 'entrances',
    categoryLabel: 'Xuất hiện',
    description: 'Nội dung trượt từ dưới lên',
    motionType: 'slide-up',
  },
  {
    id: 'zoom-in',
    name: 'Phóng to',
    category: 'entrances',
    categoryLabel: 'Xuất hiện',
    description: 'Scale vào tiêu điểm',
    motionType: 'zoom-in',
  },
  {
    id: 'ken-burns',
    name: 'Ken Burns',
    category: 'backgrounds',
    categoryLabel: 'Nền / Cảnh',
    description: 'Pan/zoom điện ảnh chậm',
    motionType: 'ken-burns',
  },
  {
    id: 'parallax-drift',
    name: 'Parallax trôi',
    category: 'backgrounds',
    categoryLabel: 'Nền / Cảnh',
    description: 'Lớp nền trôi sâu (alias ken-burns)',
    motionType: 'ken-burns',
  },
  {
    id: 'crossfade',
    name: 'Chuyển mờ',
    category: 'transitions',
    categoryLabel: 'Chuyển cảnh',
    description: 'Blend giữa các slide/scene',
    motionType: 'fade-in',
  },
];

const CATEGORY_LABELS: Record<MotionCategory, string> = {
  'kinetic-text': 'Chữ động',
  entrances: 'Xuất hiện',
  backgrounds: 'Nền / Cảnh',
  transitions: 'Chuyển cảnh',
};

const BRAND_ACCENTS = [
  '#38bdf8',
  '#a78bfa',
  '#34d399',
  '#fb7185',
  '#fbbf24',
  '#60a5fa',
  '#c084fc',
  '#2dd4bf',
];

async function dirExists(dir: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function resolveFirstExisting(dirs: string[]): Promise<string | null> {
  for (const dir of dirs) {
    if (await dirExists(dir)) return dir;
  }
  return null;
}

/**
 * Parse simple YAML-ish frontmatter from SKILL.md / DESIGN.md.
 */
function parseFrontmatter(markdown: string): Record<string, string> {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match?.[1]) return {};

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.+)$/);
    if (!m) continue;
    meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return meta;
}

function humanizeId(id: string): string {
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function readOptionalText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function inferTemplateType(input: {
  id: string;
  name: string;
  mode?: string;
  scenario?: string;
  surface?: string;
  description?: string;
}): TemplateType {
  const hay = [
    input.mode,
    input.scenario,
    input.surface,
    input.id,
    input.name,
    input.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/quiz|test|exam|cau hoi|trac nghiem/.test(hay)) return 'quiz';
  if (/worksheet|phieu|bai tap|exercise|homework/.test(hay)) return 'worksheet';
  if (/certificate|chung chi|giay khen|award|diploma/.test(hay))
    return 'certificate';
  if (/resume|cv|ho so|curriculum/.test(hay)) return 'resume';
  if (/brochure|to roi|leaflet|catalog/.test(hay)) return 'brochure';
  if (/newsletter|ban tin|email digest/.test(hay)) return 'newsletter';
  if (/infographic|so do|chart story/.test(hay)) return 'infographic';
  if (/landing|trang dich|homepage|saas|prototype/.test(hay)) return 'landing';
  if (/event|su kien|invitation|lich|ticket|workshop/.test(hay)) return 'event';
  if (/social|instagram|facebook|tiktok|reels|story|zalo/.test(hay))
    return 'social';
  if (/video|reel|motion|short|mp4|storyboard/.test(hay)) return 'video';
  if (/poster|frame|flyer|banner|cover|print|an pham/.test(hay)) return 'poster';
  if (/doc|report|bao cao|document|memo|whitepaper/.test(hay)) return 'document';
  if (/deck|slide|presentation|ppt|keynote|thuyet trinh|office/.test(hay))
    return 'deck';
  return 'deck';
}

async function findThumbnail(folder: string): Promise<string | null> {
  for (const name of THUMBNAIL_NAMES) {
    const full = path.join(folder, name);
    try {
      await fs.access(full);
      // Serve via a future static mount if needed; for now return relative hint
      return full;
    } catch {
      // continue
    }
  }
  return null;
}

/**
 * Scan html-anything skill folders and return template metadata.
 */
export async function getAvailableTemplates(): Promise<TemplateMeta[]> {
  const root = await resolveFirstExisting(TEMPLATE_CANDIDATE_DIRS);
  if (!root) {
    return FALLBACK_TEMPLATES;
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const templates: TemplateMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

    const folder = path.join(root, entry.name);
    const skillPath = path.join(folder, 'SKILL.md');
    const skillMd = await readOptionalText(skillPath);

    const fm = skillMd ? parseFrontmatter(skillMd) : {};
    const id = fm.name || entry.name;
    const name = fm.title || humanizeId(id);
    const description = fm.description;
    const mode = fm.mode;
    const scenario = fm.scenario;
    const surface = fm.surface;
    const type = inferTemplateType({
      id,
      name,
      mode,
      scenario,
      surface,
      description,
    });

    templates.push({
      id,
      name,
      type,
      description,
      mode,
      scenario,
      surface,
      path: folder,
      thumbnail: await findThumbnail(folder),
    });
  }

  templates.sort((a, b) => a.name.localeCompare(b.name));
  return templates.length > 0 ? templates : FALLBACK_TEMPLATES;
}

/**
 * Scan open-design design-systems folders (DESIGN.md brand packs).
 */
export async function getAvailableBrands(): Promise<BrandMeta[]> {
  const root = await resolveFirstExisting(BRAND_CANDIDATE_DIRS);
  if (!root) {
    return FALLBACK_BRANDS;
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const brands: BrandMeta[] = [];
  let accentIndex = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const folder = path.join(root, entry.name);
    const designPath = path.join(folder, 'DESIGN.md');
    const manifestPath = path.join(folder, 'manifest.json');

    const designMd = await readOptionalText(designPath);
    if (!designMd) {
      const hasManifest = await readOptionalText(manifestPath);
      if (!hasManifest) continue;
    }

    let name = humanizeId(entry.name);
    let description: string | undefined;

    if (designMd) {
      const fm = parseFrontmatter(designMd);
      if (fm.name || fm.title) name = fm.name || fm.title;
      description = fm.description;

      if (!fm.name && !fm.title) {
        const h1 = designMd.match(/^#\s+(.+)$/m);
        if (h1?.[1]) name = h1[1].trim();
      }
    }

    try {
      const manifestRaw = await readOptionalText(manifestPath);
      if (manifestRaw) {
        const manifest = JSON.parse(manifestRaw) as {
          name?: string;
          description?: string;
          id?: string;
        };
        if (manifest.name) name = manifest.name;
        if (manifest.description) description = manifest.description;
      }
    } catch {
      // ignore bad manifest
    }

    brands.push({
      id: entry.name,
      name,
      description,
      accent: BRAND_ACCENTS[accentIndex % BRAND_ACCENTS.length],
      path: folder,
    });
    accentIndex += 1;
  }

  brands.sort((a, b) => a.name.localeCompare(b.name));
  return brands.length > 0 ? brands : FALLBACK_BRANDS;
}

function inferMotionCategory(id: string, name: string): MotionCategory {
  const hay = `${id} ${name}`.toLowerCase();
  if (/type|glitch|kinetic|text|writer/.test(hay)) return 'kinetic-text';
  if (/fade|slide|zoom|enter|rise|pop/.test(hay)) return 'entrances';
  if (/ken|burn|parallax|bg|background|drift/.test(hay)) return 'backgrounds';
  return 'transitions';
}

/**
 * Return categorized motion recipes for motion-anything.
 * Merges disk discoveries (if tools are cloned) with built-in recipes.
 */
export async function getAvailableMotions(): Promise<MotionRecipe[]> {
  const byId = new Map<string, MotionRecipe>();
  for (const m of BUILTIN_MOTIONS) {
    byId.set(m.id, m);
  }

  const root = await resolveFirstExisting(MOTION_CANDIDATE_DIRS);
  if (root) {
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      for (const entry of entries) {
        const id = entry.name.replace(/\.(json|md|ts|js)$/i, '');
        if (!id || id.startsWith('.')) continue;
        if (byId.has(id)) continue;

        const category = inferMotionCategory(id, id);
        byId.set(id, {
          id,
          name: humanizeId(id),
          category,
          categoryLabel: CATEGORY_LABELS[category],
          description: `Discovered in motion-anything/${path.basename(root)}`,
          motionType: id,
        });
      }
    } catch {
      // soft-fail to builtins
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.category !== b.category) {
      return a.categoryLabel.localeCompare(b.categoryLabel);
    }
    return a.name.localeCompare(b.name);
  });
}

export const assetService = {
  getAvailableTemplates,
  getAvailableBrands,
  getAvailableMotions,
  inferTemplateType,
  toolsRoot: TOOLS_ROOT,
};

export default assetService;
