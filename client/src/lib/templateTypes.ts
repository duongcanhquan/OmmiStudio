import type { ContentType } from '../api/engine'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  Clapperboard,
  FileText,
  HelpCircle,
  Image,
  LayoutTemplate,
  Mail,
  Newspaper,
  Presentation,
  Share2,
  ShoppingBag,
} from 'lucide-react'

/** Loại mẫu hiển thị trong Studio — dùng để lọc thư viện */
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
  | 'quiz'

export type TemplateFilter = 'all' | TemplateType

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  deck: 'Thuyết trình',
  poster: 'Poster',
  video: 'Video',
  social: 'Mạng xã hội',
  document: 'Tài liệu',
  landing: 'Trang đích',
  newsletter: 'Bản tin',
  infographic: 'Infographic',
  certificate: 'Chứng chỉ',
  resume: 'CV / Hồ sơ',
  brochure: 'Brochure',
  event: 'Sự kiện',
  worksheet: 'Phiếu bài tập',
  quiz: 'Câu hỏi / Quiz',
}

export const TEMPLATE_TYPE_ICONS: Record<TemplateType, LucideIcon> = {
  deck: Presentation,
  poster: Image,
  video: Clapperboard,
  social: Share2,
  document: FileText,
  landing: ShoppingBag,
  newsletter: Mail,
  infographic: Newspaper,
  certificate: Award,
  resume: Briefcase,
  brochure: BookOpen,
  event: CalendarDays,
  worksheet: LayoutTemplate,
  quiz: HelpCircle,
}

export const TEMPLATE_FILTERS: { id: TemplateFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'deck', label: 'Thuyết trình' },
  { id: 'poster', label: 'Poster' },
  { id: 'video', label: 'Video' },
  { id: 'social', label: 'Mạng xã hội' },
  { id: 'document', label: 'Tài liệu' },
  { id: 'landing', label: 'Trang đích' },
  { id: 'newsletter', label: 'Bản tin' },
  { id: 'infographic', label: 'Infographic' },
  { id: 'certificate', label: 'Chứng chỉ' },
  { id: 'resume', label: 'CV' },
  { id: 'brochure', label: 'Brochure' },
  { id: 'event', label: 'Sự kiện' },
  { id: 'worksheet', label: 'Phiếu bài tập' },
  { id: 'quiz', label: 'Quiz' },
]

/** Nhóm bộ lọc theo ngành — hiển thị dọc, không kéo ngang */
export const TEMPLATE_CATEGORY_GROUPS: {
  id: string
  label: string
  types: TemplateFilter[]
}[] = [
  {
    id: 'all',
    label: 'Tất cả mẫu',
    types: ['all'],
  },
  {
    id: 'media',
    label: 'Truyền thông',
    types: ['deck', 'video', 'poster', 'social'],
  },
  {
    id: 'edu',
    label: 'Giáo dục',
    types: ['worksheet', 'quiz', 'certificate', 'document'],
  },
  {
    id: 'biz',
    label: 'Thương mại',
    types: ['landing', 'brochure', 'newsletter', 'infographic'],
  },
  {
    id: 'career',
    label: 'Sự kiện & Career',
    types: ['event', 'resume'],
  },
]

export interface RequiredContentField {
  key: string
  label: string
  placeholder: string
  required: boolean
  multiline?: boolean
}

/** Trường tối thiểu theo loại mẫu — đảm bảo đủ thông tin trước khi render */
export const REQUIRED_FIELDS_BY_TYPE: Record<TemplateType, RequiredContentField[]> = {
  deck: [
    { key: 'title', label: 'Tiêu đề bài thuyết trình', placeholder: 'VD: Orientation sinh viên 2026', required: true },
    { key: 'audience', label: 'Đối tượng', placeholder: 'VD: Tân sinh viên, phụ huynh…', required: true },
    { key: 'keyPoints', label: 'Ý chính (mỗi dòng 1 ý)', placeholder: 'Giới thiệu trường\nLịch học\nFAQ', required: true, multiline: true },
  ],
  poster: [
    { key: 'title', label: 'Tiêu đề poster', placeholder: 'VD: Ngày hội Open Day', required: true },
    { key: 'cta', label: 'Lời kêu gọi (CTA)', placeholder: 'Đăng ký ngay', required: true },
    { key: 'datePlace', label: 'Thời gian / Địa điểm', placeholder: '12/09 · Hội trường A', required: false },
  ],
  video: [
    { key: 'title', label: 'Tiêu đề video', placeholder: 'VD: 60 giây giới thiệu trường', required: true },
    { key: 'hook', label: 'Hook mở đầu', placeholder: 'Câu mở đầu thu hút…', required: true },
    { key: 'scenes', label: 'Các cảnh (mỗi dòng 1 cảnh)', placeholder: 'Cảnh 1…\nCảnh 2…', required: true, multiline: true },
  ],
  social: [
    { key: 'title', label: 'Caption chính', placeholder: 'Nội dung bài đăng…', required: true, multiline: true },
    { key: 'hashtags', label: 'Hashtag', placeholder: '#tuyensinh #edu', required: false },
    { key: 'cta', label: 'CTA', placeholder: 'Nhắn tin để tư vấn', required: true },
  ],
  document: [
    { key: 'title', label: 'Tiêu đề tài liệu', placeholder: 'Báo cáo / Memo…', required: true },
    { key: 'summary', label: 'Tóm tắt', placeholder: '3–5 câu tóm tắt…', required: true, multiline: true },
    { key: 'sections', label: 'Các mục chính', placeholder: 'Mục 1\nMục 2', required: true, multiline: true },
  ],
  landing: [
    { key: 'title', label: 'Headline', placeholder: 'Khóa học / sản phẩm…', required: true },
    { key: 'valueProp', label: 'Giá trị cốt lõi', placeholder: 'Vì sao chọn chúng tôi…', required: true, multiline: true },
    { key: 'cta', label: 'CTA', placeholder: 'Đăng ký miễn phí', required: true },
  ],
  newsletter: [
    { key: 'title', label: 'Tiêu đề bản tin', placeholder: 'Bản tin tháng 9', required: true },
    { key: 'highlights', label: 'Tin nổi bật', placeholder: 'Tin 1\nTin 2', required: true, multiline: true },
    { key: 'cta', label: 'CTA', placeholder: 'Đọc thêm', required: false },
  ],
  infographic: [
    { key: 'title', label: 'Chủ đề', placeholder: 'Thống kê tuyển sinh 2026', required: true },
    { key: 'stats', label: 'Số liệu (mỗi dòng 1)', placeholder: '1200 học viên\n95% hài lòng', required: true, multiline: true },
  ],
  certificate: [
    { key: 'recipient', label: 'Người nhận', placeholder: 'Họ và tên', required: true },
    { key: 'achievement', label: 'Thành tích / khóa học', placeholder: 'Hoàn thành khóa…', required: true },
    { key: 'date', label: 'Ngày cấp', placeholder: '02/09/2026', required: true },
  ],
  resume: [
    { key: 'fullName', label: 'Họ tên', placeholder: 'Nguyễn Văn A', required: true },
    { key: 'role', label: 'Vị trí mong muốn', placeholder: 'Giáo viên / Marketer…', required: true },
    { key: 'skills', label: 'Kỹ năng chính', placeholder: 'Kỹ năng 1, 2, 3…', required: true, multiline: true },
  ],
  brochure: [
    { key: 'title', label: 'Tiêu đề brochure', placeholder: 'Chương trình đào tạo…', required: true },
    { key: 'offers', label: 'Ưu đãi / nội dung', placeholder: 'Điểm nổi bật…', required: true, multiline: true },
    { key: 'contact', label: 'Liên hệ', placeholder: 'Hotline / email', required: true },
  ],
  event: [
    { key: 'title', label: 'Tên sự kiện', placeholder: 'Lễ tốt nghiệp 2026', required: true },
    { key: 'datetime', label: 'Thời gian', placeholder: '19:00 · 20/09/2026', required: true },
    { key: 'venue', label: 'Địa điểm', placeholder: 'Hội trường…', required: true },
  ],
  worksheet: [
    { key: 'title', label: 'Tên phiếu', placeholder: 'Phiếu ôn tập tuần 3', required: true },
    { key: 'grade', label: 'Lớp / trình độ', placeholder: 'Lớp 10', required: true },
    { key: 'tasks', label: 'Bài tập', placeholder: 'Bài 1…\nBài 2…', required: true, multiline: true },
  ],
  quiz: [
    { key: 'title', label: 'Tiêu đề quiz', placeholder: 'Kiểm tra nhanh chương 2', required: true },
    { key: 'questions', label: 'Câu hỏi (mỗi dòng 1)', placeholder: 'Câu 1…\nCâu 2…', required: true, multiline: true },
  ],
}

export function templateTypeToContentType(type: TemplateType): ContentType {
  if (type === 'video' || type === 'social') return 'video'
  if (
    type === 'poster' ||
    type === 'landing' ||
    type === 'infographic' ||
    type === 'certificate'
  ) {
    return 'poster'
  }
  return 'slide'
}

export function inferTypeFromMeta(input: {
  mode?: string
  id?: string
  name?: string
  description?: string
  scenario?: string
  surface?: string
  type?: string
}): TemplateType {
  if (input.type && input.type in TEMPLATE_TYPE_LABELS) {
    return input.type as TemplateType
  }

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
    .toLowerCase()

  if (/quiz|test|exam|câu hỏi|trac nghiem/.test(hay)) return 'quiz'
  if (/worksheet|phiếu|bài tập|exercise|homework/.test(hay)) return 'worksheet'
  if (/certificate|chứng chỉ|giấy khen|award|diploma/.test(hay)) return 'certificate'
  if (/resume|cv|hồ sơ|curriculum/.test(hay)) return 'resume'
  if (/brochure|tờ rơi|leaflet|catalog/.test(hay)) return 'brochure'
  if (/newsletter|bản tin|email digest/.test(hay)) return 'newsletter'
  if (/infographic|sơ đồ|chart story/.test(hay)) return 'infographic'
  if (/landing|trang đích|homepage|saas/.test(hay)) return 'landing'
  if (/event|sự kiện|invitation|lịch|ticket/.test(hay)) return 'event'
  if (/social|instagram|facebook|tiktok|reels|story|zalo/.test(hay)) return 'social'
  if (/video|reel|motion|short|mp4|storyboard/.test(hay)) return 'video'
  if (/poster|frame|flyer|banner|cover|print|ấn phẩm/.test(hay)) return 'poster'
  if (/doc|report|báo cáo|document|memo|whitepaper/.test(hay)) return 'document'
  if (/deck|slide|presentation|ppt|keynote|thuyết trình/.test(hay)) return 'deck'
  return 'deck'
}

/** Hint theo loại mẫu — AI viết đúng tính chất format */
export const TEMPLATE_AI_GUIDANCE: Record<TemplateType, string> = {
  deck: 'Viết outline slide thuyết trình: mỗi scene = 1 slide (tiêu đề ngắn + bullet). Giọng trình bày rõ, logic mở → thân → kết.',
  poster: 'Viết copy poster: headline mạnh, subline ngắn, CTA rõ. Ít chữ — ưu tiên punch line.',
  video: 'Viết storyboard: mỗi scene có visualText (chữ trên hình) + voiceoverText (lời thoại TTS). Nhịp 3–8s/cảnh, hook mở đầu.',
  social: 'Viết caption mạng xã hội + CTA + hashtag. Ngắn, dễ share, đúng platform.',
  document: 'Viết cấu trúc tài liệu: tiêu đề, tóm tắt, các mục có luận điểm.',
  landing: 'Viết copy landing: headline, value props, social proof gợi ý, CTA.',
  newsletter: 'Viết bản tin: mở đầu, các tin nổi bật, CTA đọc thêm.',
  infographic: 'Chuyển số liệu thành các điểm visual ngắn, dễ đọc trên khung hình.',
  certificate: 'Nội dung trang trọng: người nhận, thành tích, ngày — không marketing ồn ào.',
  resume: 'Tóm tắt hồ sơ chuyên nghiệp: vị trí, kỹ năng, thành tựu ngắn.',
  brochure: 'Copy brochure: lợi ích, ưu đãi, liên hệ — thân thiện, thuyết phục.',
  event: 'Thông tin sự kiện rõ: tên, thời gian, địa điểm, lý do tham dự, CTA.',
  worksheet: 'Phiếu bài tập rõ ràng: hướng dẫn ngắn + danh sách bài.',
  quiz: 'Câu hỏi rõ, đáp án gợi ý nếu có — phù hợp kiểm tra nhanh.',
}

export interface BrandPromptSlice {
  name: string
  industry?: string
  tone?: string
  personality?: string
  doSay?: string
  dontSay?: string
  fonts?: string
  colors?: string
}

/** Ghép field form + rich HTML thành prompt gửi AI/pipeline */
export function buildPromptFromFields(
  fields: Record<string, string>,
  richHtml: string,
  templateType: TemplateType
): string {
  const schema = REQUIRED_FIELDS_BY_TYPE[templateType] ?? []
  const lines: string[] = [
    `Loại nội dung: ${TEMPLATE_TYPE_LABELS[templateType]}`,
    '',
  ]
  for (const f of schema) {
    const v = fields[f.key]?.trim()
    if (v) lines.push(`${f.label}: ${v}`)
  }
  const plain = richHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  if (plain) {
    lines.push('', 'Nội dung soạn thảo:', plain)
  }
  return lines.join('\n').trim()
}

/**
 * Prompt đầy đủ cho AI: tính chất mẫu + brand + brief sáng tạo + field + script.
 */
export function buildStudioPrompt(input: {
  templateType: TemplateType
  templateName?: string
  brand?: BrandPromptSlice | null
  aiBrief?: string
  scriptNotes?: string
  fields: Record<string, string>
  richHtml: string
}): string {
  const {
    templateType,
    templateName,
    brand,
    aiBrief,
    scriptNotes,
    fields,
    richHtml,
  } = input

  const lines: string[] = [
    '=== NHIỆM VỤ ===',
    `Tạo nội dung tiếng Việt đúng tính chất mẫu «${TEMPLATE_TYPE_LABELS[templateType]}»${
      templateName ? ` (${templateName})` : ''
    }.`,
    TEMPLATE_AI_GUIDANCE[templateType],
    '',
  ]

  if (brand?.name) {
    lines.push(
      '=== THƯƠNG HIỆU ===',
      `Tên: ${brand.name}`,
      brand.industry ? `Ngành: ${brand.industry}` : '',
      brand.tone ? `Tone giọng: ${brand.tone}` : '',
      brand.personality ? `Tính cách: ${brand.personality}` : '',
      brand.doSay ? `Nên nói: ${brand.doSay}` : '',
      brand.dontSay ? `Không nói: ${brand.dontSay}` : '',
      brand.fonts ? `Font: ${brand.fonts}` : '',
      brand.colors ? `Màu: ${brand.colors}` : '',
      'Giữ nhất quán brand trong mọi câu chữ.',
      ''
    )
  }

  if (aiBrief?.trim()) {
    lines.push(
      '=== BRIEF SÁNG TẠO (ưu tiên cao) ===',
      aiBrief.trim(),
      ''
    )
  }

  if (scriptNotes?.trim()) {
    lines.push(
      '=== CẤU TRÚC / LOGIC KỊCH BẢN ===',
      scriptNotes.trim(),
      ''
    )
  }

  lines.push('=== THÔNG TIN MẪU (form) ===')
  const schema = REQUIRED_FIELDS_BY_TYPE[templateType] ?? []
  for (const f of schema) {
    const v = fields[f.key]?.trim()
    if (v) lines.push(`${f.label}: ${v}`)
  }

  const plain = richHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
  if (plain) {
    lines.push('', '=== BẢN NHÁP HIỆN CÓ (có thể viết lại / mở rộng) ===', plain)
  }

  lines.push(
    '',
    '=== OUTPUT ===',
    'Trả JSON storyboard đúng schema hệ thống (scenes[]). Không markdown ngoài JSON.'
  )

  return lines.filter((l) => l !== undefined).join('\n').trim()
}
