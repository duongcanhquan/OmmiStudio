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
  video: 'Video chữ động',
  social: 'Ảnh mạng xã hội',
  document: 'Tài liệu',
  landing: 'Trang đích',
  newsletter: 'Bản tin',
  infographic: 'Sơ đồ số liệu',
  certificate: 'Chứng chỉ',
  resume: 'CV / Hồ sơ',
  brochure: 'Tờ rơi',
  event: 'Sự kiện',
  worksheet: 'Phiếu bài tập',
  quiz: 'Câu hỏi',
}

export const TEMPLATE_TYPE_ICONS: Record<TemplateType, LucideIcon> = {
  deck: Presentation,
  poster: Image,
  video: Clapperboard,
  social: Image,
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
  { id: 'video', label: 'Video chữ động' },
  { id: 'social', label: 'Ảnh mạng xã hội' },
  { id: 'document', label: 'Tài liệu' },
  { id: 'landing', label: 'Trang đích' },
  { id: 'newsletter', label: 'Bản tin' },
  { id: 'infographic', label: 'Sơ đồ số liệu' },
  { id: 'certificate', label: 'Chứng chỉ' },
  { id: 'resume', label: 'CV' },
  { id: 'brochure', label: 'Tờ rơi' },
  { id: 'event', label: 'Sự kiện' },
  { id: 'worksheet', label: 'Phiếu bài tập' },
  { id: 'quiz', label: 'Câu hỏi' },
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
    label: 'Sự kiện & nghề nghiệp',
    types: ['event', 'resume'],
  },
]

export interface RequiredContentField {
  key: string
  label: string
  placeholder: string
  required: boolean
  multiline?: boolean
  /** Nếu có — hiển thị select thay vì input tự do */
  options?: { value: string; label: string }[]
  hint?: string
  /** Giá trị mặc định — select không được để trống giả (placeholder ≠ value) */
  defaultValue?: string
}

/** Dropdown / thông số kỹ thuật — không chặn tiến trình */
export function isSettingsField(field: RequiredContentField): boolean {
  return Boolean(field.options?.length)
}

/** Chỉ chữ người dùng viết mới bắt buộc; select luôn có mặc định */
export function isFieldRequired(field: RequiredContentField): boolean {
  if (isSettingsField(field)) return false
  return field.required
}

export function fieldDefaultValue(field: RequiredContentField): string {
  if (field.defaultValue) return field.defaultValue
  if (field.options?.length) {
    const match = field.options.find((opt) => opt.value === field.placeholder)
    return match?.value ?? field.options[0].value
  }
  return ''
}

export function defaultFieldValues(type: TemplateType): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of REQUIRED_FIELDS_BY_TYPE[type] ?? []) {
    const next = fieldDefaultValue(field)
    if (next) values[field.key] = next
  }
  return values
}

export function mergeFieldDefaults(
  type: TemplateType,
  current: Record<string, string>
): Record<string, string> {
  const filled = Object.fromEntries(
    Object.entries(current).filter(([, value]) => Boolean(value?.trim()))
  )
  return { ...defaultFieldValues(type), ...filled }
}

export function stripRichText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function getMissingRequiredFields(
  type: TemplateType | undefined,
  values: Record<string, string>,
  story?: {
    aiBrief?: string
    richHtml?: string
    scriptNotes?: string
    parts?: { title?: string; body?: string; notes?: string }[]
  }
): RequiredContentField[] {
  if (!type) return []
  const missing: RequiredContentField[] = []
  if (!values.title?.trim()) {
    missing.push({
      key: 'title',
      label: 'Tiêu đề sản phẩm',
      placeholder: '',
      required: true,
    })
  }
  const hasPart = Boolean(
    story?.parts?.some(
      (part) => part.title?.trim() || part.body?.trim() || part.notes?.trim()
    )
  )
  if (!hasPart) {
    missing.push({
      key: 'parts',
      label: 'Ít nhất một phần có nội dung',
      placeholder: '',
      required: true,
    })
  }
  return missing
}

export function hasUserAuthoredContent(
  type: TemplateType | undefined,
  input: {
    prompt?: string
    aiBrief?: string
    scriptNotes?: string
    richHtml?: string
    fieldValues: Record<string, string>
  }
): boolean {
  if (input.prompt?.trim()) return true
  if (input.aiBrief?.trim()) return true
  if (input.scriptNotes?.trim()) return true
  if (stripRichText(input.richHtml ?? '')) return true
  const schema = type ? (REQUIRED_FIELDS_BY_TYPE[type] ?? []) : []
  return schema.some(
    (field) =>
      !isSettingsField(field) && Boolean(input.fieldValues[field.key]?.trim())
  )
}

/** Trường cấu hình theo từng loại mẫu — mỗi type có bộ riêng phù hợp */
export const REQUIRED_FIELDS_BY_TYPE: Record<TemplateType, RequiredContentField[]> = {
  deck: [
    { key: 'title', label: 'Tiêu đề bài thuyết trình', placeholder: 'VD: Định hướng sinh viên 2026', required: true, hint: 'Tên ngắn của bài. VD: Định hướng sinh viên 2026' },
    { key: 'audience', label: 'Đối tượng nghe', placeholder: 'Tân sinh viên, phụ huynh, đối tác…', required: false, hint: 'Không bắt buộc. Ai sẽ xem slide này?' },
    {
      key: 'slideCount',
      label: 'Số slide',
      placeholder: '10',
      required: true,
      options: [
        { value: '5', label: '5 — giới thiệu ngắn' },
        { value: '8', label: '8 — chuẩn' },
        { value: '12', label: '12 — đầy đủ' },
        { value: '18', label: '18 — hội thảo' },
        { value: '25', label: '25 — đào tạo dài' },
        { value: '40', label: '40 — khóa học / bài đầy đủ' },
      ],
    },
    {
      key: 'aspect',
      label: 'Tỷ lệ trình chiếu',
      placeholder: '16:9',
      required: true,
      options: [
        { value: '16:9', label: '16:9 — màn rộng' },
        { value: '4:3', label: '4:3 — máy chiếu cũ' },
        { value: 'A4', label: 'A4 dọc — tờ phát tay' },
        { value: 'ultrawide', label: '21:9 — màn siêu rộng' },
      ],
    },
    {
      key: 'density',
      label: 'Mật độ nội dung',
      placeholder: 'balanced',
      required: true,
      options: [
        { value: 'minimal', label: 'Tối giản — ít chữ, nhiều hình' },
        { value: 'balanced', label: 'Cân bằng' },
        { value: 'dense', label: 'Dày — nhiều gạch đầu dòng / số liệu' },
      ],
    },
    {
      key: 'deckStyle',
      label: 'Phong cách bài',
      placeholder: 'corporate',
      required: false,
      options: [
        { value: 'corporate', label: 'Doanh nghiệp' },
        { value: 'edu', label: 'Giáo dục / thân thiện' },
        { value: 'startup', label: 'Gọi vốn khởi nghiệp' },
        { value: 'academic', label: 'Học thuật' },
      ],
    },
    { key: 'keyPoints', label: 'Ý chính (mỗi dòng 1 ý)', placeholder: 'Mở đầu\nVấn đề\nGiải pháp\nKết', required: false, multiline: true, hint: 'Không bắt buộc nếu bạn đã viết trong khung kịch bản.' },
    { key: 'extraDetail', label: 'Ghi chú thêm', placeholder: 'Có slide hỏi đáp cuối, tránh hiệu ứng mạnh…', required: false, multiline: true },
  ],

  poster: [
    { key: 'title', label: 'Tiêu đề poster', placeholder: 'VD: Ngày hội mở cửa trường', required: true, hint: 'Dòng chữ lớn nhất trên poster.' },
    {
      key: 'size',
      label: 'Khổ in / khung',
      placeholder: 'A3',
      required: true,
      options: [
        { value: 'A5', label: 'A5 — tờ rơi nhỏ' },
        { value: 'A4', label: 'A4 (210×297 mm)' },
        { value: 'A3', label: 'A3 (297×420 mm)' },
        { value: 'A2', label: 'A2 (420×594 mm)' },
        { value: 'A1', label: 'A1 — biển đứng / tường' },
        { value: '1080x1350', label: '1080×1350 — Instagram dọc' },
        { value: '1080x1080', label: '1080×1080 — vuông' },
        { value: '1920x1080', label: '1920×1080 — banner ngang' },
        { value: 'custom', label: 'Khác (ghi ở chi tiết)' },
      ],
    },
    {
      key: 'orientation',
      label: 'Hướng',
      placeholder: 'portrait',
      required: true,
      options: [
        { value: 'portrait', label: 'Dọc' },
        { value: 'landscape', label: 'Ngang' },
      ],
    },
    {
      key: 'printDpi',
      label: 'Độ phân giải in',
      placeholder: '300',
      required: false,
      options: [
        { value: '72', label: '72 dpi — chỉ màn hình' },
        { value: '150', label: '150 dpi — in nhanh' },
        { value: '300', label: '300 dpi — in offset chuẩn' },
      ],
    },
    {
      key: 'layoutStyle',
      label: 'Bố cục',
      placeholder: 'hero-center',
      required: false,
      options: [
        { value: 'hero-center', label: 'Tiêu điểm giữa — chữ lớn' },
        { value: 'split', label: 'Chia đôi ảnh / chữ' },
        { value: 'grid', label: 'Lưới thông tin' },
        { value: 'minimal', label: 'Tối giản sang trọng' },
      ],
    },
    { key: 'cta', label: 'Nút kêu gọi', placeholder: 'Đăng ký ngay', required: false, hint: 'Hành động bạn muốn người xem làm. VD: Đăng ký ngay' },
    { key: 'datePlace', label: 'Thời gian / Địa điểm', placeholder: '12/09 · Hội trường A', required: false },
    { key: 'extraDetail', label: 'Chi tiết thiết kế thêm', placeholder: 'Lề tràn 3mm, giữ vùng an toàn logo, mã QR góc dưới…', required: false, multiline: true },
  ],

  video: [
    { key: 'title', label: 'Tiêu đề video', placeholder: 'VD: Phim giới thiệu trường / khóa học', required: true, hint: 'Tên video. VD: Ngày hội mở cửa 2026 — 45 giây' },
    {
      key: 'durationSec',
      label: 'Thời lượng mục tiêu',
      placeholder: '60',
      required: true,
      options: [
        { value: '15', label: '15 giây — đoạn mở đầu' },
        { value: '30', label: '30 giây' },
        { value: '45', label: '45 giây' },
        { value: '60', label: '1 phút' },
        { value: '90', label: '1 phút 30' },
        { value: '120', label: '2 phút' },
        { value: '180', label: '3 phút' },
        { value: '300', label: '5 phút' },
        { value: '600', label: '10 phút' },
        { value: '900', label: '15 phút' },
        { value: '1800', label: '30 phút' },
        { value: '2700', label: '45 phút' },
        { value: '3600', label: '60 phút (tối đa)' },
      ],
      hint: 'Tối đa 60 phút. Video dài AI viết theo chương / khối cảnh.',
    },
    {
      key: 'sceneCount',
      label: 'Số cảnh / khối',
      placeholder: '6',
      required: true,
      options: [
        { value: '3', label: '3 — siêu ngắn' },
        { value: '5', label: '5' },
        { value: '8', label: '8' },
        { value: '12', label: '12' },
        { value: '16', label: '16' },
        { value: '24', label: '24 — phim trung bình' },
        { value: '36', label: '36 — dài' },
        { value: '48', label: '48 — rất dài' },
        { value: '60', label: '60 — khoảng 1 giờ (≈1 cảnh/phút)' },
      ],
      hint: 'Nên khớp thời lượng: ngắn 3–8 cảnh · 10–15p ≈12–24 · 30–60p ≈24–60 khối.',
    },
    {
      key: 'aspect',
      label: 'Tỷ lệ khung hình',
      placeholder: '16:9',
      required: true,
      options: [
        { value: '9:16', label: '9:16 — video dọc mạng xã hội' },
        { value: '16:9', label: '16:9 — YouTube / nằm ngang' },
        { value: '1:1', label: '1:1 — bảng tin vuông' },
        { value: '4:5', label: '4:5 — Instagram' },
        { value: '21:9', label: '21:9 — điện ảnh' },
      ],
    },
    {
      key: 'resolution',
      label: 'Độ phân giải xuất',
      placeholder: '1080p',
      required: true,
      options: [
        { value: '720p', label: '720p — nhẹ, nhanh' },
        { value: '1080p', label: '1080p — độ nét cao' },
        { value: '1440p', label: '1440p QHD' },
        { value: '4k', label: '4K UHD' },
      ],
    },
    {
      key: 'pacing',
      label: 'Nhịp dựng',
      placeholder: 'medium',
      required: true,
      options: [
        { value: 'fast', label: 'Nhanh — cắt nhiều, sôi động' },
        { value: 'medium', label: 'Vừa — kể chuyện rõ' },
        { value: 'slow', label: 'Chậm — điện ảnh / cảm xúc' },
        { value: 'lecture', label: 'Bài giảng — ổn định, rõ lời' },
      ],
    },
    {
      key: 'voiceMode',
      label: 'Hình thức âm thanh',
      placeholder: 'voiceover',
      required: true,
      options: [
        { value: 'voiceover', label: 'Lời đọc TTS xuyên suốt' },
        { value: 'vo-music', label: 'Lời đọc + nhạc nền' },
        { value: 'music-only', label: 'Chủ yếu nhạc / chữ trên màn hình' },
        { value: 'dialogue', label: 'Đối thoại nhiều nhân vật (kịch bản)' },
      ],
    },
    {
      key: 'structure',
      label: 'Cấu trúc kịch bản',
      placeholder: 'hook-body-cta',
      required: false,
      options: [
        { value: 'hook-body-cta', label: 'Mở đầu → thân → kêu gọi' },
        { value: 'problem-solution', label: 'Vấn đề → giải pháp → chứng cứ' },
        { value: 'chapters', label: 'Theo chương (video dài)' },
        { value: 'timeline', label: 'Dòng thời gian / ngày trong đời' },
        { value: 'interview', label: 'Phỏng vấn / hỏi đáp' },
        { value: 'tutorial', label: 'Hướng dẫn từng bước' },
      ],
    },
    { key: 'hook', label: 'Câu mở đầu', placeholder: 'VD: Chọn trường cho con không chỉ là chọn điểm.', required: false, hint: 'Không bắt buộc — có thể viết luôn trong khung kịch bản.' },
    { key: 'scenes', label: 'Dàn ý cảnh (tuỳ chọn)', placeholder: 'Mở\n3 lợi ích\nKêu gọi đăng ký', required: false, multiline: true, hint: 'Mỗi dòng 1 cảnh. Bỏ trống nếu kịch bản đã đủ.' },
    { key: 'extraDetail', label: 'Ghi chú sản xuất', placeholder: 'Phụ đề cháy, nhạc nhẹ, không logo đối thủ…', required: false, multiline: true },
  ],

  social: [
    { key: 'title', label: 'Nội dung bài đăng', placeholder: 'Viết chú thích bạn muốn đăng…', required: true, multiline: true, hint: 'Nội dung người xem đọc trên mạng xã hội.' },
    {
      key: 'outputFormat',
      label: 'File xuất',
      placeholder: 'image',
      required: true,
      defaultValue: 'image',
      hint: 'Bài đăng mặc định là ảnh PNG. Chỉ chọn video nếu bạn muốn Reels / TikTok chữ động.',
      options: [
        { value: 'image', label: 'Ảnh tĩnh — file PNG để đăng' },
        { value: 'video', label: 'Video chữ động — file MP4' },
      ],
    },
    {
      key: 'platform',
      label: 'Nền tảng',
      placeholder: 'instagram',
      required: true,
      options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube-shorts', label: 'YouTube Shorts' },
        { value: 'zalo', label: 'Zalo OA' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'threads', label: 'Threads' },
      ],
    },
    {
      key: 'size',
      label: 'Kích thước bài đăng',
      placeholder: '1080x1080',
      required: true,
      options: [
        { value: '1080x1080', label: '1080×1080 — bảng tin vuông' },
        { value: '1080x1350', label: '1080×1350 — bảng tin dọc 4:5' },
        { value: '1080x1440', label: '1080×1440 — thẻ kiến thức 3:4' },
        { value: '1080x1920', label: '1080×1920 — story / reel' },
        { value: '1200x630', label: '1200×630 — link share FB' },
        { value: '1280x720', label: '1280×720 — ảnh thu nhỏ YouTube' },
      ],
    },
    {
      key: 'postType',
      label: 'Loại bài',
      placeholder: 'single',
      required: true,
      options: [
        { value: 'single', label: '1 ảnh / 1 frame' },
        { value: 'carousel', label: 'Băng chuyền nhiều trang' },
        { value: 'story', label: 'Tin 24 giờ' },
        { value: 'reel-cover', label: 'Ảnh bìa / thu nhỏ video dọc' },
      ],
    },
    {
      key: 'carouselPages',
      label: 'Số trang băng chuyền (nếu có)',
      placeholder: '1',
      required: false,
      options: [
        { value: '1', label: '1 (không băng chuyền)' },
        { value: '3', label: '3 trang' },
        { value: '5', label: '5 trang' },
        { value: '7', label: '7 trang' },
        { value: '10', label: '10 trang' },
      ],
    },
    { key: 'hashtags', label: 'Thẻ chủ đề', placeholder: '#tuyensinh #giaoduc', required: false },
    { key: 'cta', label: 'Nút kêu gọi', placeholder: 'Nhắn tin để tư vấn', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Gắn @thương hiệu, nhãn bình chọn, liên kết tiểu sử…', required: false, multiline: true },
  ],

  document: [
    { key: 'title', label: 'Tiêu đề tài liệu', placeholder: 'Báo cáo / ghi nhớ / sách trắng…', required: true, hint: 'Tên tài liệu. VD: Báo cáo tuyển sinh tháng 9' },
    {
      key: 'docType',
      label: 'Loại tài liệu',
      placeholder: 'report',
      required: true,
      options: [
        { value: 'report', label: 'Báo cáo' },
        { value: 'memo', label: 'Ghi nhớ nội bộ' },
        { value: 'proposal', label: 'Đề xuất' },
        { value: 'whitepaper', label: 'Sách trắng' },
        { value: 'policy', label: 'Quy định / chính sách' },
      ],
    },
    {
      key: 'size',
      label: 'Khổ trang',
      placeholder: 'A4',
      required: true,
      options: [
        { value: 'A4', label: 'A4 dọc' },
        { value: 'A4-landscape', label: 'A4 ngang' },
        { value: 'Letter', label: 'Khổ Letter (Mỹ)' },
        { value: 'A5', label: 'A5' },
      ],
    },
    {
      key: 'pageCount',
      label: 'Độ dài ước tính',
      placeholder: '4',
      required: false,
      options: [
        { value: '1', label: '1 trang' },
        { value: '2', label: '2 trang' },
        { value: '4', label: '3–4 trang' },
        { value: '8', label: '5–8 trang' },
        { value: '15', label: '10–15 trang' },
      ],
    },
    {
      key: 'formality',
      label: 'Mức trang trọng',
      placeholder: 'formal',
      required: false,
      options: [
        { value: 'formal', label: 'Trang trọng' },
        { value: 'neutral', label: 'Trung tính' },
        { value: 'friendly', label: 'Thân thiện nội bộ' },
      ],
    },
    { key: 'summary', label: 'Tóm tắt ngắn', placeholder: '3–5 câu ý chính…', required: false, multiline: true, hint: 'Không bắt buộc nếu đã viết trong khung nội dung.' },
    { key: 'sections', label: 'Các mục (tuỳ chọn)', placeholder: 'Mục 1\nMục 2', required: false, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Có mục lục, chú thích cuối trang, bảng số liệu…', required: false, multiline: true },
  ],

  landing: [
    { key: 'title', label: 'Tiêu đề lớn', placeholder: 'Khóa học / sản phẩm…', required: true, hint: 'Câu tiêu đề lớn trên trang. VD: Học IELTS 6.5 trong 12 tuần' },
    {
      key: 'size',
      label: 'Ưu tiên thiết bị',
      placeholder: 'both',
      required: true,
      options: [
        { value: 'desktop', label: 'Ưu tiên máy tính (1440+)' },
        { value: 'mobile', label: 'Ưu tiên điện thoại' },
        { value: 'both', label: 'Tự co giãn cân bằng' },
      ],
    },
    {
      key: 'sectionsCount',
      label: 'Số mục trên trang',
      placeholder: '5',
      required: true,
      options: [
        { value: '3', label: '3 — tối giản' },
        { value: '5', label: '5 — chuẩn' },
        { value: '7', label: '7 — đầy đủ' },
        { value: '9', label: '9 — dạng dài' },
      ],
    },
    {
      key: 'heroStyle',
      label: 'Kiểu phần mở đầu',
      placeholder: 'split',
      required: false,
      options: [
        { value: 'full-bleed', label: 'Ảnh nền tràn khung' },
        { value: 'split', label: 'Chữ trái / ảnh phải' },
        { value: 'centered', label: 'Giữa, tối giản' },
        { value: 'video-bg', label: 'Nền kiểu video' },
      ],
    },
    { key: 'valueProp', label: 'Vì sao chọn chúng tôi', placeholder: '3 lợi ích chính…', required: false, multiline: true },
    { key: 'socialProof', label: 'Bằng chứng xã hội (tuỳ chọn)', placeholder: '1200 học viên · 4.9★…', required: false, multiline: true },
    { key: 'cta', label: 'Nút kêu gọi', placeholder: 'Đăng ký miễn phí', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Biểu mẫu để lại liên hệ, câu hỏi thường gặp, so sánh gói…', required: false, multiline: true },
  ],

  newsletter: [
    { key: 'title', label: 'Tiêu đề bản tin', placeholder: 'Bản tin tháng 9', required: true, hint: 'Tên số bản tin. VD: Bản tin tháng 9' },
    {
      key: 'size',
      label: 'Chiều rộng email',
      placeholder: '600',
      required: true,
      options: [
        { value: '600', label: '600px — chuẩn' },
        { value: '640', label: '640px' },
        { value: '700', label: '700px — rộng hơn' },
      ],
    },
    {
      key: 'issueType',
      label: 'Kiểu số',
      placeholder: 'digest',
      required: true,
      options: [
        { value: 'digest', label: 'Tóm tắt nhiều tin' },
        { value: 'promo', label: 'Ưu đãi / khuyến mại' },
        { value: 'announcement', label: 'Thông báo 1 tin chính' },
        { value: 'nurture', label: 'Nuôi dưỡng khách tiềm năng' },
      ],
    },
    {
      key: 'blocks',
      label: 'Số khối nội dung',
      placeholder: '4',
      required: false,
      options: [
        { value: '2', label: '2 khối' },
        { value: '3', label: '3 khối' },
        { value: '4', label: '4 khối' },
        { value: '6', label: '6 khối' },
      ],
    },
    { key: 'highlights', label: 'Tin nổi bật (tuỳ chọn)', placeholder: 'Tin 1\nTin 2', required: false, multiline: true },
    { key: 'cta', label: 'Nút kêu gọi', placeholder: 'Đọc thêm', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Dòng xem trước email, chân trang hủy đăng ký, tương thích nền tối…', required: false, multiline: true },
  ],

  infographic: [
    { key: 'title', label: 'Chủ đề', placeholder: 'Thống kê tuyển sinh 2026', required: true, hint: 'Chủ đề sơ đồ số liệu. VD: Tuyển sinh 2026 theo ngành' },
    {
      key: 'size',
      label: 'Kích thước khung',
      placeholder: '1080x1920',
      required: true,
      options: [
        { value: '1080x1920', label: '1080×1920 — story dọc dài' },
        { value: '1080x1080', label: '1080×1080 — vuông' },
        { value: '800x2000', label: '800×2000 — infographic web dài' },
        { value: 'A3', label: 'A3 in' },
        { value: 'A2', label: 'A2 in lớn' },
        { value: '1920x1080', label: '1920×1080 — ngang trình chiếu' },
      ],
    },
    {
      key: 'vizStyle',
      label: 'Kiểu trực quan',
      placeholder: 'icons-stats',
      required: true,
      options: [
        { value: 'icons-stats', label: 'Biểu tượng + số lớn' },
        { value: 'timeline', label: 'Dòng thời gian' },
        { value: 'comparison', label: 'So sánh 2 cột' },
        { value: 'process', label: 'Quy trình bước' },
        { value: 'map', label: 'Bản đồ / vùng' },
      ],
    },
    {
      key: 'statCount',
      label: 'Số điểm dữ liệu',
      placeholder: '6',
      required: false,
      options: [
        { value: '4', label: '4 điểm' },
        { value: '6', label: '6 điểm' },
        { value: '8', label: '8 điểm' },
        { value: '12', label: '12 điểm' },
      ],
    },
    { key: 'stats', label: 'Số liệu (tuỳ chọn, mỗi dòng 1)', placeholder: '1200 học viên\n95% hài lòng', required: false, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Nguồn số liệu, chú thích đơn vị, màu nhấn…', required: false, multiline: true },
  ],

  certificate: [
    { key: 'recipient', label: 'Người nhận', placeholder: 'Họ và tên', required: true, hint: 'Họ tên in trên chứng chỉ.' },
    { key: 'achievement', label: 'Thành tích / khóa học', placeholder: 'Hoàn thành khóa…', required: true, hint: 'VD: Hoàn thành khóa tiếp thị số' },
    { key: 'date', label: 'Ngày cấp', placeholder: '02/09/2026', required: true, hint: 'Ngày ghi trên chứng chỉ.' },
    {
      key: 'size',
      label: 'Khổ giấy',
      placeholder: 'A4-landscape',
      required: true,
      options: [
        { value: 'A4-landscape', label: 'A4 ngang' },
        { value: 'A4', label: 'A4 dọc' },
        { value: 'A3-landscape', label: 'A3 ngang' },
        { value: 'letter-landscape', label: 'Khổ Letter ngang' },
      ],
    },
    {
      key: 'ornament',
      label: 'Mức trang trí',
      placeholder: 'classic',
      required: false,
      options: [
        { value: 'minimal', label: 'Tối giản hiện đại' },
        { value: 'classic', label: 'Cổ điển / viền hoa văn' },
        { value: 'formal-seal', label: 'Trang trọng + dấu mộc' },
      ],
    },
    { key: 'signer', label: 'Người ký / chức danh', placeholder: 'Hiệu trưởng · …', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Số hiệu chứng chỉ, QR xác thực…', required: false, multiline: true },
  ],

  resume: [
    { key: 'fullName', label: 'Họ tên', placeholder: 'Nguyễn Văn A', required: true, hint: 'Họ tên ứng viên trên CV.' },
    { key: 'role', label: 'Vị trí mong muốn', placeholder: 'Giáo viên / nhân viên tiếp thị…', required: true, hint: 'Vị trí ứng tuyển. VD: Giáo viên Toán' },
    {
      key: 'size',
      label: 'Khổ & độ dài',
      placeholder: 'A4',
      required: true,
      options: [
        { value: 'A4', label: 'A4 — 1 trang' },
        { value: 'A4-2', label: 'A4 — tối đa 2 trang' },
        { value: 'Letter', label: 'Khổ Letter — 1 trang' },
      ],
    },
    {
      key: 'layout',
      label: 'Bố cục CV',
      placeholder: 'single',
      required: true,
      options: [
        { value: 'single', label: '1 cột' },
        { value: 'sidebar', label: 'Cột trái (ảnh / kỹ năng)' },
        { value: 'two-col', label: '2 cột cân' },
      ],
    },
    {
      key: 'photo',
      label: 'Ảnh đại diện',
      placeholder: 'no',
      required: false,
      options: [
        { value: 'no', label: 'Không ảnh' },
        { value: 'yes', label: 'Có chỗ ảnh' },
      ],
    },
    { key: 'skills', label: 'Kỹ năng chính', placeholder: 'Kỹ năng 1, 2, 3…', required: true, multiline: true },
    { key: 'experience', label: 'Kinh nghiệm nổi bật', placeholder: 'Công ty A — vai trò — thành tựu…', required: false, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Dễ đọc bởi máy lọc hồ sơ, không icon màu, ngôn ngữ Việt…', required: false, multiline: true },
  ],

  brochure: [
    { key: 'title', label: 'Tiêu đề tờ rơi', placeholder: 'Chương trình đào tạo…', required: true, hint: 'Tên ấn phẩm. VD: Chương trình ĐH chính quy 2026' },
    {
      key: 'size',
      label: 'Khổ / kiểu gấp',
      placeholder: 'A4-trifold',
      required: true,
      options: [
        { value: 'A4-trifold', label: 'A4 gấp 3 (6 mặt)' },
        { value: 'A4-bifold', label: 'A4 gấp đôi (4 mặt)' },
        { value: 'A5-bifold', label: 'A5 gấp đôi' },
        { value: 'A4-flat', label: 'A4 2 mặt không gấp' },
        { value: 'DL', label: 'Khổ DL — tờ rơi' },
      ],
    },
    {
      key: 'panels',
      label: 'Ưu tiên mặt nội dung',
      placeholder: 'benefits',
      required: false,
      options: [
        { value: 'benefits', label: 'Lợi ích + ưu đãi' },
        { value: 'program', label: 'Chương trình / lịch' },
        { value: 'campus', label: 'Cơ sở / hình ảnh' },
        { value: 'mixed', label: 'Cân bằng tất cả' },
      ],
    },
    { key: 'offers', label: 'Ưu đãi / nội dung chính', placeholder: 'Điểm nổi bật…', required: false, multiline: true },
    { key: 'contact', label: 'Liên hệ', placeholder: 'Hotline / email / địa chỉ', required: false },
    { key: 'extraDetail', label: 'Chi tiết in ấn', placeholder: 'Lề tràn, giấy Couche, mã QR đăng ký…', required: false, multiline: true },
  ],

  event: [
    { key: 'title', label: 'Tên sự kiện', placeholder: 'Lễ tốt nghiệp 2026', required: true, hint: 'Tên sự kiện in trên thiệp / poster.' },
    { key: 'datetime', label: 'Thời gian', placeholder: '19:00 · 20/09/2026', required: true, hint: 'Giờ và ngày. VD: 19:00 · 20/09/2026' },
    { key: 'venue', label: 'Địa điểm', placeholder: 'Hội trường A, cơ sở 1', required: true, hint: 'Nơi diễn ra sự kiện.' },
    {
      key: 'size',
      label: 'Định dạng ấn phẩm',
      placeholder: 'A5',
      required: true,
      options: [
        { value: 'A5', label: 'A5 — thiệp mời' },
        { value: 'A6', label: 'A6 — thiệp nhỏ' },
        { value: 'A4', label: 'A4 — poster sự kiện' },
        { value: '1080x1920', label: 'Tin dọc trên mạng' },
        { value: '1080x1080', label: 'Bài đăng vuông' },
        { value: 'ticket', label: 'Vé ngang' },
      ],
    },
    {
      key: 'eventAsset',
      label: 'Loại ấn phẩm',
      placeholder: 'invite',
      required: true,
      options: [
        { value: 'invite', label: 'Thiệp mời' },
        { value: 'poster', label: 'Poster sự kiện' },
        { value: 'ticket', label: 'Vé vào cửa' },
        { value: 'agenda', label: 'Chương trình sự kiện' },
        { value: 'badge', label: 'Thẻ tên' },
      ],
    },
    { key: 'dressCode', label: 'Trang phục / ghi chú', placeholder: 'Trang phục lịch sự…', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Liên kết xác nhận tham dự, bản đồ, MC, khách mời…', required: false, multiline: true },
  ],

  worksheet: [
    { key: 'title', label: 'Tên phiếu', placeholder: 'Phiếu ôn tập tuần 3', required: true, hint: 'Tên phiếu học sinh thấy trên đầu trang.' },
    { key: 'grade', label: 'Lớp / trình độ', placeholder: 'Lớp 10', required: true, hint: 'VD: Lớp 10, IELTS 5.0, năm 1' },
    {
      key: 'size',
      label: 'Khổ giấy',
      placeholder: 'A4',
      required: true,
      options: [
        { value: 'A4', label: 'A4' },
        { value: 'A5', label: 'A5' },
        { value: 'A3', label: 'A3 — làm nhóm' },
      ],
    },
    {
      key: 'difficulty',
      label: 'Độ khó',
      placeholder: 'medium',
      required: false,
      options: [
        { value: 'easy', label: 'Dễ' },
        { value: 'medium', label: 'Trung bình' },
        { value: 'hard', label: 'Khó' },
        { value: 'mixed', label: 'Lẫn mức' },
      ],
    },
    {
      key: 'taskCount',
      label: 'Số bài / câu',
      placeholder: '8',
      required: false,
      options: [
        { value: '5', label: '5' },
        { value: '8', label: '8' },
        { value: '12', label: '12' },
        { value: '20', label: '20' },
      ],
    },
    { key: 'tasks', label: 'Nội dung bài tập (tuỳ chọn)', placeholder: 'Bài 1…\nBài 2…', required: false, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Có đáp án riêng, thời gian làm 30p…', required: false, multiline: true },
  ],

  quiz: [
    { key: 'title', label: 'Tiêu đề câu hỏi', placeholder: 'Kiểm tra nhanh chương 2', required: true, hint: 'Tên bài kiểm tra. VD: Ôn tập chương 2' },
    {
      key: 'questionCount',
      label: 'Số câu hỏi',
      placeholder: '10',
      required: true,
      options: [
        { value: '5', label: '5 câu' },
        { value: '10', label: '10 câu' },
        { value: '15', label: '15 câu' },
        { value: '20', label: '20 câu' },
        { value: '30', label: '30 câu' },
        { value: '50', label: '50 câu' },
      ],
    },
    {
      key: 'questionType',
      label: 'Dạng câu',
      placeholder: 'mcq',
      required: true,
      options: [
        { value: 'mcq', label: 'Trắc nghiệm 1 đáp án' },
        { value: 'multi', label: 'Nhiều đáp án đúng' },
        { value: 'tf', label: 'Đúng / Sai' },
        { value: 'short', label: 'Trả lời ngắn' },
        { value: 'mixed', label: 'Hỗn hợp' },
      ],
    },
    {
      key: 'size',
      label: 'Định dạng xuất',
      placeholder: 'A4',
      required: false,
      options: [
        { value: 'A4', label: 'Phiếu A4 in' },
        { value: 'slides', label: 'Slide trình chiếu' },
        { value: 'interactive', label: 'Tương tác / web' },
      ],
    },
    {
      key: 'includeAnswers',
      label: 'Đáp án',
      placeholder: 'separate',
      required: false,
      options: [
        { value: 'none', label: 'Không kèm đáp án' },
        { value: 'inline', label: 'Đáp án ngay sau câu' },
        { value: 'separate', label: 'Trang đáp án riêng' },
      ],
    },
    { key: 'questions', label: 'Gợi ý câu hỏi (tuỳ chọn)', placeholder: 'Câu 1…\nCâu 2…', required: false, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Thời gian 20p, mỗi câu 1 điểm…', required: false, multiline: true },
  ],
}

export function templateTypeToContentType(
  type: TemplateType,
  fieldValues?: Record<string, string>
): ContentType {
  if (type === 'video') return 'video'
  if (type === 'social') {
    return fieldValues?.outputFormat === 'video' ? 'video' : 'poster'
  }
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

/** Hướng dẫn ngắn trên bước kịch bản — nói rõ phải điền gì */
export const TEMPLATE_SCRIPT_HELP: Record<
  TemplateType,
  { intro: string; placeholder: string }
> = {
  deck: {
    intro: 'Chỉ cần tên bài. Ý chính viết trong khung bên dưới — mỗi đoạn ~ 1 slide.',
    placeholder:
      'VD:\nSlide 1 — Mở: Chào tân sinh viên, 3 điều sẽ biết hôm nay.\nSlide 2 — Lịch học kỳ…\nSlide cuối — Q&A.',
  },
  poster: {
    intro: 'Điền tiêu đề poster. CTA, ngày giờ, địa điểm viết thêm nếu có.',
    placeholder: 'VD: Ngày hội Open Day 12/09 · Hội trường A. Đăng ký tại QR.',
  },
  video: {
    intro:
      'Đây là video HTML có motion: mỗi cảnh một câu ngắn trên trang thiết kế (màu, chữ chạy). Xem trước để thấy chuyển động; xuất MP4 sẽ quay trang đó. Không quay camera, không tạo hình AI.',
    placeholder:
      'VD:\nCảnh 1 (0–5s): Chữ «Chọn trường cho con không chỉ là chọn điểm.» Lời đọc cùng câu đó.\nCảnh 2: Ba lợi ích — ngắn, một ý một dòng.\nCảnh cuối: «Đăng ký ngày hội mở cửa.»',
  },
  social: {
    intro:
      'Đây là ẢNH bài đăng (file PNG), không phải video. Mỗi khung = một bức. Muốn clip thì đổi «File xuất» sang video hoặc chọn mẫu Video chữ động.',
    placeholder: 'VD: 3 lý do phụ huynh chọn chúng tôi năm nay… Nhắn tin để tư vấn.',
  },
  document: {
    intro: 'Điền tên tài liệu. Nội dung các mục viết trong khung bên dưới.',
    placeholder: 'VD:\nTóm tắt: …\n1. Bối cảnh\n2. Số liệu\n3. Đề xuất',
  },
  landing: {
    intro: 'Điền headline. Lợi ích và CTA viết thêm trong khung nội dung.',
    placeholder: 'VD: Học IELTS 6.5 trong 12 tuần. 3 lợi ích… Nút: Đăng ký học thử.',
  },
  newsletter: {
    intro: 'Điền tên số bản tin. Liệt kê tin nổi bật trong khung nội dung.',
    placeholder: 'VD: Bản tin tháng 9 — tin 1, tin 2, CTA đọc thêm.',
  },
  infographic: {
    intro: 'Điền chủ đề. Mỗi dòng một số liệu trong khung nội dung.',
    placeholder: 'VD:\n1200 học viên\n95% hài lòng\n12 ngành đào tạo',
  },
  certificate: {
    intro: 'Điền người nhận, thành tích và ngày cấp — đó là nội dung chứng chỉ.',
    placeholder: 'Ghi chú thêm nếu cần: số hiệu, QR xác thực…',
  },
  resume: {
    intro: 'Điền họ tên và vị trí ứng tuyển. Kỹ năng / kinh nghiệm viết bên dưới.',
    placeholder: 'VD:\nKỹ năng: giảng dạy, soạn giáo án…\nKinh nghiệm: Trường A — 3 năm.',
  },
  brochure: {
    intro: 'Điền tên brochure. Ưu đãi và liên hệ viết trong khung nội dung.',
    placeholder: 'VD: Học bổng 30%. Hotline 0900… Cơ sở 1, quận 3.',
  },
  event: {
    intro: 'Điền tên sự kiện, thời gian và địa điểm — đủ để làm thiệp / poster.',
    placeholder: 'Ghi chú thêm: dress code, RSVP, khách mời…',
  },
  worksheet: {
    intro: 'Điền tên phiếu và lớp. Câu bài tập viết trong khung nội dung.',
    placeholder: 'VD:\nBài 1: …\nBài 2: …',
  },
  quiz: {
    intro: 'Điền tên quiz. Gợi ý câu hỏi viết bên dưới — AI có thể soạn đủ số câu.',
    placeholder: 'VD:\nChủ đề: thì hiện tại đơn\nCâu 1: …',
  },
}

/** Giải thích format thật — tránh hiểu nhầm video = phim quay / clip AI */
export const TEMPLATE_FORMAT_NOTE: Partial<Record<TemplateType, string>> = {
  video:
    'Sản phẩm: MP4 quay từ trang html-video đang chạy (màu, blob, chữ chạy, recipe motion). Xem trước iframe là bản sống; file PNG của mẫu ảnh vẫn là một khung đứng.',
  social:
    'Mặc định xuất ẢNH PNG (đăng Facebook / Instagram / Zalo). Trong form có ô «File xuất» nếu bạn muốn đổi sang video chữ động MP4.',
}

/** Hint theo loại mẫu — AI viết đúng tính chất format */
export const TEMPLATE_AI_GUIDANCE: Record<TemplateType, string> = {
  deck: 'Viết đúng số slide + tỷ lệ + mật độ đã chọn. Mỗi cảnh = 1 slide (tiêu đề + gạch đầu dòng ngắn). Chỉ tiếng Việt.',
  poster: 'Chữ poster đúng khổ/hướng: tiêu đề mạnh, nút kêu gọi rõ, ít chữ. Chỉ tiếng Việt.',
  video:
    'Chỉ viết kịch bản chữ động tiếng Việt: visualText tối đa một câu ngắn (lên hình), voiceoverText là lời đọc, kèm số giây và kiểu chuyển động. Không mô tả cảnh quay, không sinh hình.',
  social:
    'Viết chữ ngắn cho ẢNH bài đăng: tiêu đề lớn, 1–2 câu phụ, CTA. Đúng tỷ lệ (vuông / Story). Chỉ tiếng Việt. Không viết kịch bản video trừ khi người dùng chọn file MP4.',
  document: 'Cấu trúc tài liệu đúng loại + khổ + độ dài: tóm tắt rồi các mục. Chỉ tiếng Việt.',
  landing: 'Nội dung trang đích đúng số phần + kiểu mở đầu; có giá trị cốt lõi và nút kêu gọi. Chỉ tiếng Việt.',
  newsletter: 'Bản tin đúng chiều rộng email, kiểu số và số khối; dòng xem trước trong tóm tắt nếu cần.',
  infographic: 'Điểm dữ liệu trực quan đúng số lượng + kiểu hình + khung kích thước.',
  certificate: 'Nội dung trang trọng đúng khổ giấy và mức trang trí; không quảng cáo ồn.',
  resume: 'CV đúng bố cục/khổ; kỹ năng + kinh nghiệm ngắn, chuyên nghiệp.',
  brochure: 'Lời tờ rơi đúng kiểu gấp và mặt ưu tiên; lợi ích + liên hệ rõ.',
  event: 'Thông tin sự kiện + đúng loại ấn phẩm (thiệp/poster/vé) và kích thước.',
  worksheet: 'Phiếu bài tập đúng khổ, độ khó, số câu.',
  quiz: 'Câu hỏi đúng số lượng + dạng câu + cách kèm đáp án.',
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
  layoutName?: string
  layoutHint?: string
  brand?: BrandPromptSlice | null
  aiBrief?: string
  scriptNotes?: string
  fields: Record<string, string>
  richHtml: string
}): string {
  const {
    templateType,
    templateName,
    layoutName,
    layoutHint,
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

  if (layoutName) {
    lines.push(
      '=== BỐ CỤC ĐÃ CHỌN ===',
      `Tên: ${layoutName}`,
      layoutHint ? `Cách xếp: ${layoutHint}` : '',
      'Viết chữ khớp chỗ đặt (tiêu đề, từ nhấn, số, CTA) — không đổi layout.',
      ''
    )
  }

  if (brand?.name) {
    lines.push(
      '=== THƯƠNG HIỆU ===',
      `Tên: ${brand.name}`,
      brand.industry ? `Ngành: ${brand.industry}` : '',
      brand.tone ? `Giọng điệu: ${brand.tone}` : '',
      brand.personality ? `Tính cách: ${brand.personality}` : '',
      brand.doSay ? `Nên nói: ${brand.doSay}` : '',
      brand.dontSay ? `Không nói: ${brand.dontSay}` : '',
      brand.fonts ? `Font: ${brand.fonts}` : '',
      brand.colors ? `Màu: ${brand.colors}` : '',
      'Giữ nhất quán thương hiệu trong mọi câu chữ.',
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
    '=== ĐẦU RA ===',
    'Trả JSON kịch bản hình đúng schema hệ thống (scenes[]).',
    'Mọi chữ trong visualText và voiceoverText phải là tiếng Việt có dấu — không tiếng Anh, không tiếng Trung.',
    'Tuân thủ chính xác: thời lượng (tối đa 60 phút), số cảnh/block, kích thước, tỷ lệ, phong cách trong form.',
    'Video dài: chia chương/block; tổng thời lượng các cảnh ≈ thời lượng mục tiêu.',
    'Không markdown ngoài JSON.'
  )

  return lines.filter((l) => l !== undefined).join('\n').trim()
}
