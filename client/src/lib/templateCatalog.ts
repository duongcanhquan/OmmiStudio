import type { TemplateMeta } from '../api/engine'
import {
  defaultFieldValues,
  type TemplateType,
} from './templateTypes'
import { defaultMetaValues, defaultParts, type ScriptPart } from './scriptForm'

export type OutputFormat = 'image' | 'video' | 'html' | 'pdf'
export type PreviewFrame =
  | 'square'
  | 'portrait'
  | 'landscape'
  | 'stack'
  | 'sheet'
  | 'slides'

export interface StudioCatalogItem extends TemplateMeta {
  output: OutputFormat
  outputLabel: string
  purpose: string
  skillId: string
  frame: PreviewFrame
  accent: string
  accent2: string
}

/**
 * Một card = một loại sản phẩm + file xuất rõ (ảnh / video / slide / PDF).
 */
export const CURATED_STUDIO_TEMPLATES: StudioCatalogItem[] = [
  {
    id: 'social-vuong',
    name: 'Ảnh bài đăng vuông',
    type: 'social',
    description:
      'Thẻ html-anything «deck-xhs-pastel»: bố cục editorial, màu pastel, chữ lớn. File xuất PNG.',
    path: '(curated)',
    output: 'image',
    outputLabel: 'ẢNH PNG',
    purpose: 'Ảnh kiến thức Instagram / Facebook / Zalo',
    skillId: 'deck-xhs-pastel',
    frame: 'square',
    accent: '#e11d48',
    accent2: '#fb7185',
  },
  {
    id: 'social-story',
    name: 'Ảnh Story dọc',
    type: 'social',
    description:
      'Skill «deck-xhs-white»: thẻ editorial trắng, chữ lớn. File xuất PNG 9:16. Muốn clip → Video dọc.',
    path: '(curated)',
    output: 'image',
    outputLabel: 'ẢNH PNG',
    purpose: 'Ảnh Story 24 giờ',
    skillId: 'deck-xhs-white',
    frame: 'portrait',
    accent: '#7c3aed',
    accent2: '#c084fc',
  },
  {
    id: 'social-carousel',
    name: 'Carousel nhiều ảnh',
    type: 'social',
    description:
      'Skill «social-carousel»: 3 thẻ cinematic (màu trời / đồng / chân dung CSS). File xuất zip PNG.',
    path: '(curated)',
    output: 'image',
    outputLabel: 'ẢNH PNG',
    purpose: 'Nhiều ảnh kéo ngang',
    skillId: 'social-carousel',
    frame: 'stack',
    accent: '#db2777',
    accent2: '#f472b6',
  },
  {
    id: 'video-ngang',
    name: 'Video chữ động ngang',
    type: 'video',
    description:
      'Dành cho trình chiếu / YouTube. File xuất: MP4 16:9 quay từ trang html-video «liquid hero» (blob màu, chữ sáng, dòng chữ chạy).',
    path: '(curated)',
    output: 'video',
    outputLabel: 'VIDEO MP4',
    purpose: 'Video ngang máy chiếu / YouTube',
    skillId: 'video-hyperframes',
    frame: 'landscape',
    accent: '#ea580c',
    accent2: '#fb923c',
  },
  {
    id: 'video-doc',
    name: 'Video chữ động dọc',
    type: 'video',
    description:
      'Dành cho Reels / TikTok / Shorts. File xuất: MP4 9:16 quay từ trang html-video «vfx-text-cursor» (con trỏ, scramble, chữ chạy).',
    path: '(curated)',
    output: 'video',
    outputLabel: 'VIDEO MP4',
    purpose: 'Video dọc Reels / TikTok',
    skillId: 'vfx-text-cursor',
    frame: 'portrait',
    accent: '#d97706',
    accent2: '#fbbf24',
  },
  {
    id: 'poster-mot-mat',
    name: 'Poster một mặt',
    type: 'poster',
    description:
      'Skill «article-sketchnote-editorial»: trang minh họa + SVG. File xuất HTML (mở / in).',
    path: '(curated)',
    output: 'html',
    outputLabel: 'POSTER HTML',
    purpose: 'Poster một mặt in / đăng',
    skillId: 'article-sketchnote-editorial',
    frame: 'portrait',
    accent: '#0d9488',
    accent2: '#2dd4bf',
  },
  {
    id: 'deck-chuan',
    name: 'Bài thuyết trình',
    type: 'deck',
    description: 'Skill «deck-product-launch»: slide cover + khối sản phẩm. File xuất HTML 16:9.',
    path: '(curated)',
    output: 'html',
    outputLabel: 'SLIDE HTML',
    purpose: 'Thuyết trình họp / giảng dạy',
    skillId: 'deck-product-launch',
    frame: 'slides',
    accent: '#2563eb',
    accent2: '#60a5fa',
  },
  {
    id: 'infographic-so-lieu',
    name: 'Sơ đồ số liệu',
    type: 'infographic',
    description: 'Skill «live-dashboard»: KPI, thẻ, biểu đồ. File xuất HTML đồ họa.',
    path: '(curated)',
    output: 'html',
    outputLabel: 'ĐỒ HỌA HTML',
    purpose: 'Sơ đồ số liệu',
    skillId: 'live-dashboard',
    frame: 'portrait',
    accent: '#0891b2',
    accent2: '#22d3ee',
  },
  {
    id: 'document-a4',
    name: 'Tài liệu / báo cáo PDF',
    type: 'document',
    description: 'Dành cho báo cáo in. File xuất: PDF A4.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF A4',
    purpose: 'Tài liệu / báo cáo in',
    skillId: 'doc-kami-parchment',
    frame: 'sheet',
    accent: '#334155',
    accent2: '#94a3b8',
  },
  {
    id: 'newsletter-email',
    name: 'Bản tin email',
    type: 'newsletter',
    description: 'Dành cho gửi email / in bản tin. File xuất: PDF.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF',
    purpose: 'Bản tin phụ huynh / học viên',
    skillId: 'email-marketing',
    frame: 'sheet',
    accent: '#4f46e5',
    accent2: '#818cf8',
  },
  {
    id: 'landing-dich',
    name: 'Trang đích',
    type: 'landing',
    description:
      'Skill «web-proto-soft»: landing đầy đủ (hero, mesh, preview). File xuất HTML.',
    path: '(curated)',
    output: 'html',
    outputLabel: 'TRANG HTML',
    purpose: 'Trang đích khóa / dịch vụ',
    skillId: 'web-proto-soft',
    frame: 'landscape',
    accent: '#059669',
    accent2: '#34d399',
  },
  {
    id: 'brochure-to-roi',
    name: 'Tờ rơi',
    type: 'brochure',
    description: 'Dành cho phát tay. File xuất: PDF tờ rơi.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF',
    purpose: 'Tờ rơi phát tay',
    skillId: 'digital-eguide',
    frame: 'sheet',
    accent: '#b45309',
    accent2: '#f59e0b',
  },
  {
    id: 'event-su-kien',
    name: 'Ấn phẩm sự kiện',
    type: 'event',
    description:
      'Skill «waitlist-page»: trang sự kiện đầy đủ, có chỗ logo. Xem HTML; xuất PDF.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF',
    purpose: 'Thiệp / poster sự kiện',
    skillId: 'waitlist-page',
    frame: 'square',
    accent: '#be185d',
    accent2: '#f472b6',
  },
  {
    id: 'certificate-giay',
    name: 'Chứng chỉ / giấy khen',
    type: 'certificate',
    description: 'Dành cho giấy khen / chứng chỉ. File xuất: HTML một trang.',
    path: '(curated)',
    output: 'html',
    outputLabel: 'GIẤY HTML',
    purpose: 'Chứng chỉ / giấy khen',
    skillId: 'magazine-poster',
    frame: 'landscape',
    accent: '#a16207',
    accent2: '#facc15',
  },
  {
    id: 'resume-cv',
    name: 'CV / hồ sơ',
    type: 'resume',
    description: 'Dành cho ứng tuyển. File xuất: PDF A4.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF A4',
    purpose: 'CV / hồ sơ ứng tuyển',
    skillId: 'resume-modern',
    frame: 'sheet',
    accent: '#1d4ed8',
    accent2: '#93c5fd',
  },
  {
    id: 'worksheet-phieu',
    name: 'Phiếu bài tập',
    type: 'worksheet',
    description: 'Dành cho phiếu in lớp. File xuất: PDF.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF',
    purpose: 'Phiếu bài tập in lớp',
    skillId: 'meeting-notes',
    frame: 'sheet',
    accent: '#0f766e',
    accent2: '#5eead4',
  },
  {
    id: 'quiz-cau-hoi',
    name: 'Bộ câu hỏi',
    type: 'quiz',
    description: 'Dành cho kiểm tra. File xuất: PDF quiz.',
    path: '(curated)',
    output: 'pdf',
    outputLabel: 'PDF',
    purpose: 'Bộ câu hỏi / kiểm tra',
    skillId: 'deck-course-module',
    frame: 'sheet',
    accent: '#6d28d9',
    accent2: '#c4b5fd',
  },
]

export function catalogById(id: string): StudioCatalogItem | undefined {
  return CURATED_STUDIO_TEMPLATES.find((item) => item.id === id)
}

export function defaultsForCatalog(template: TemplateMeta): {
  fieldValues: Record<string, string>
  parts: ScriptPart[]
} {
  const type: TemplateType = template.type
  const fieldValues = {
    ...defaultFieldValues(type),
    ...defaultMetaValues(type),
  }

  if (template.id === 'video-doc' || template.id === 'social-story') {
    fieldValues.aspect = '9:16'
    fieldValues.size = '1080x1920'
  } else if (template.id === 'social-vuong') {
    fieldValues.aspect = '3:4'
    fieldValues.size = '1080x1440'
  } else if (template.id === 'social-carousel') {
    fieldValues.aspect = '1:1'
    fieldValues.size = '1080x1080'
  } else if (template.id === 'video-ngang' || template.id === 'deck-chuan') {
    fieldValues.aspect = '16:9'
  }

  if (template.type === 'social') {
    fieldValues.outputFormat = 'image'
    fieldValues.postType =
      template.id === 'social-carousel'
        ? 'carousel'
        : template.id === 'social-story'
          ? 'story'
          : 'single'
  }

  if (template.id === 'social-vuong') fieldValues.platform = 'instagram'
  if (template.id === 'social-story') fieldValues.platform = 'instagram'
  if (template.id === 'social-carousel') fieldValues.platform = 'instagram'

  let parts = defaultParts(type)
  if (template.id === 'social-carousel') {
    parts = defaultParts(type)
    while (parts.length < 3) {
      const n = parts.length + 1
      parts = [
        ...parts,
        {
          id: `part-carousel-${n}`,
          role: 'body',
          title: `Khung ${n}`,
          body: n === 4 ? 'Lợi ích 3 — việc làm sau tốt nghiệp.' : `Ý ${n} — viết một câu.`,
        },
      ]
    }
    if (parts[0]) {
      parts[0] = {
        ...parts[0],
        title: 'Khung 1 — Mở',
        body: 'Chọn trường cho con không chỉ là chọn điểm.',
      }
    }
    const last = parts[parts.length - 1]
    if (last) {
      parts[parts.length - 1] = {
        ...last,
        role: 'cta',
        title: 'Khung cuối — CTA',
        body: 'Đăng ký ngày hội mở cửa.',
      }
    }
  }

  return { fieldValues, parts }
}
