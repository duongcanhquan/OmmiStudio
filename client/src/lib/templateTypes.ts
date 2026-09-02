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
  /** Nếu có — hiển thị select thay vì input tự do */
  options?: { value: string; label: string }[]
  hint?: string
}

/** Trường cấu hình theo từng loại mẫu — mỗi type có bộ riêng phù hợp */
export const REQUIRED_FIELDS_BY_TYPE: Record<TemplateType, RequiredContentField[]> = {
  deck: [
    { key: 'title', label: 'Tiêu đề bài thuyết trình', placeholder: 'VD: Orientation sinh viên 2026', required: true },
    { key: 'audience', label: 'Đối tượng nghe', placeholder: 'Tân sinh viên, phụ huynh, đối tác…', required: true },
    {
      key: 'slideCount',
      label: 'Số slide',
      placeholder: '10',
      required: true,
      options: [
        { value: '5', label: '5 — pitch ngắn' },
        { value: '8', label: '8 — chuẩn' },
        { value: '12', label: '12 — đầy đủ' },
        { value: '18', label: '18 — workshop' },
        { value: '25', label: '25 — đào tạo dài' },
        { value: '40', label: '40 — khóa học / full deck' },
      ],
    },
    {
      key: 'aspect',
      label: 'Tỷ lệ trình chiếu',
      placeholder: '16:9',
      required: true,
      options: [
        { value: '16:9', label: '16:9 — widescreen' },
        { value: '4:3', label: '4:3 — máy chiếu cũ' },
        { value: 'A4', label: 'A4 dọc — handout in' },
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
        { value: 'dense', label: 'Dày — nhiều bullet / số liệu' },
      ],
    },
    {
      key: 'deckStyle',
      label: 'Phong cách slide',
      placeholder: 'corporate',
      required: false,
      options: [
        { value: 'corporate', label: 'Doanh nghiệp' },
        { value: 'edu', label: 'Giáo dục / thân thiện' },
        { value: 'startup', label: 'Startup pitch' },
        { value: 'academic', label: 'Học thuật' },
      ],
    },
    { key: 'keyPoints', label: 'Ý chính (mỗi dòng 1 ý / 1 cụm slide)', placeholder: 'Mở đầu\nVấn đề\nGiải pháp\n…', required: true, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Logo góc phải, không dùng animation mạnh, có slide Q&A cuối…', required: false, multiline: true },
  ],

  poster: [
    { key: 'title', label: 'Tiêu đề poster', placeholder: 'VD: Ngày hội Open Day', required: true },
    {
      key: 'size',
      label: 'Khổ in / canvas',
      placeholder: 'A3',
      required: true,
      options: [
        { value: 'A5', label: 'A5 — flyer nhỏ' },
        { value: 'A4', label: 'A4 (210×297 mm)' },
        { value: 'A3', label: 'A3 (297×420 mm)' },
        { value: 'A2', label: 'A2 (420×594 mm)' },
        { value: 'A1', label: 'A1 — standee / tường' },
        { value: '1080x1350', label: '1080×1350 — IG portrait' },
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
        { value: 'portrait', label: 'Dọc (portrait)' },
        { value: 'landscape', label: 'Ngang (landscape)' },
      ],
    },
    {
      key: 'printDpi',
      label: 'Độ phân giải in',
      placeholder: '300',
      required: false,
      options: [
        { value: '72', label: '72 dpi — chỉ digital' },
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
        { value: 'hero-center', label: 'Hero giữa — chữ lớn' },
        { value: 'split', label: 'Chia đôi ảnh / chữ' },
        { value: 'grid', label: 'Lưới thông tin' },
        { value: 'minimal', label: 'Tối giản sang trọng' },
      ],
    },
    { key: 'cta', label: 'CTA', placeholder: 'Đăng ký ngay', required: true },
    { key: 'datePlace', label: 'Thời gian / Địa điểm', placeholder: '12/09 · Hội trường A', required: false },
    { key: 'extraDetail', label: 'Chi tiết thiết kế thêm', placeholder: 'Bleed 3mm, giữ vùng an toàn logo, QR góc dưới…', required: false, multiline: true },
  ],

  video: [
    { key: 'title', label: 'Tiêu đề video', placeholder: 'VD: Phim giới thiệu trường / khóa học', required: true },
    {
      key: 'durationSec',
      label: 'Thời lượng mục tiêu',
      placeholder: '60',
      required: true,
      options: [
        { value: '15', label: '15 giây — teaser' },
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
      hint: 'Tối đa 60 phút. Video dài AI viết theo chương / block cảnh.',
    },
    {
      key: 'sceneCount',
      label: 'Số cảnh / block',
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
        { value: '60', label: '60 — full hour (≈1 cảnh/phút)' },
      ],
      hint: 'Nên khớp thời lượng: ngắn 3–8 cảnh · 10–15p ≈12–24 · 30–60p ≈24–60 block.',
    },
    {
      key: 'aspect',
      label: 'Tỷ lệ khung hình',
      placeholder: '16:9',
      required: true,
      options: [
        { value: '9:16', label: '9:16 — Reels / TikTok / Shorts' },
        { value: '16:9', label: '16:9 — YouTube / ngang' },
        { value: '1:1', label: '1:1 — feed vuông' },
        { value: '4:5', label: '4:5 — Instagram' },
        { value: '21:9', label: '21:9 — cinematic' },
      ],
    },
    {
      key: 'resolution',
      label: 'Độ phân giải xuất',
      placeholder: '1080p',
      required: true,
      options: [
        { value: '720p', label: '720p — nhẹ, nhanh' },
        { value: '1080p', label: '1080p Full HD' },
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
        { value: 'fast', label: 'Nhanh — cắt nhiều, energy' },
        { value: 'medium', label: 'Vừa — kể chuyện rõ' },
        { value: 'slow', label: 'Chậm — cinematic / cảm xúc' },
        { value: 'lecture', label: 'Bài giảng — ổn định, rõ lời' },
      ],
    },
    {
      key: 'voiceMode',
      label: 'Hình thức âm thanh',
      placeholder: 'voiceover',
      required: true,
      options: [
        { value: 'voiceover', label: 'Voiceover TTS xuyên suốt' },
        { value: 'vo-music', label: 'Voiceover + nhạc nền' },
        { value: 'music-only', label: 'Chủ yếu nhạc / text on screen' },
        { value: 'dialogue', label: 'Đối thoại nhiều nhân vật (kịch bản)' },
      ],
    },
    {
      key: 'structure',
      label: 'Cấu trúc kịch bản',
      placeholder: 'hook-body-cta',
      required: false,
      options: [
        { value: 'hook-body-cta', label: 'Hook → thân → CTA' },
        { value: 'problem-solution', label: 'Vấn đề → giải pháp → chứng cứ' },
        { value: 'chapters', label: 'Theo chương (video dài)' },
        { value: 'timeline', label: 'Timeline / ngày trong đời' },
        { value: 'interview', label: 'Phỏng vấn / Q&A' },
        { value: 'tutorial', label: 'Hướng dẫn từng bước' },
      ],
    },
    { key: 'hook', label: 'Hook / mở đầu', placeholder: '3–8 giây đầu phải giữ người xem…', required: true },
    { key: 'scenes', label: 'Outline cảnh / chương (mỗi dòng 1)', placeholder: 'Mở\nChương 1…\nCTA', required: false, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết sản xuất thêm', placeholder: 'Subtitle burn-in, lower-third tên người, không logo đối thủ, BGM nhẹ…', required: false, multiline: true },
  ],

  social: [
    { key: 'title', label: 'Caption chính', placeholder: 'Nội dung bài đăng…', required: true, multiline: true },
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
      label: 'Kích thước post',
      placeholder: '1080x1080',
      required: true,
      options: [
        { value: '1080x1080', label: '1080×1080 — feed vuông' },
        { value: '1080x1350', label: '1080×1350 — feed dọc 4:5' },
        { value: '1080x1920', label: '1080×1920 — story / reel' },
        { value: '1200x630', label: '1200×630 — link share FB' },
        { value: '1280x720', label: '1280×720 — YouTube thumbnail style' },
      ],
    },
    {
      key: 'postType',
      label: 'Loại bài',
      placeholder: 'single',
      required: true,
      options: [
        { value: 'single', label: '1 ảnh / 1 frame' },
        { value: 'carousel', label: 'Carousel nhiều trang' },
        { value: 'story', label: 'Story (24h)' },
        { value: 'reel-cover', label: 'Cover / thumbnail reel' },
      ],
    },
    {
      key: 'carouselPages',
      label: 'Số trang carousel (nếu có)',
      placeholder: '1',
      required: false,
      options: [
        { value: '1', label: '1 (không carousel)' },
        { value: '3', label: '3 trang' },
        { value: '5', label: '5 trang' },
        { value: '7', label: '7 trang' },
        { value: '10', label: '10 trang' },
      ],
    },
    { key: 'hashtags', label: 'Hashtag', placeholder: '#tuyensinh #edu', required: false },
    { key: 'cta', label: 'CTA', placeholder: 'Nhắn tin để tư vấn', required: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Mention @brand, sticker poll, link in bio…', required: false, multiline: true },
  ],

  document: [
    { key: 'title', label: 'Tiêu đề tài liệu', placeholder: 'Báo cáo / Memo / Whitepaper…', required: true },
    {
      key: 'docType',
      label: 'Loại tài liệu',
      placeholder: 'report',
      required: true,
      options: [
        { value: 'report', label: 'Báo cáo' },
        { value: 'memo', label: 'Memo nội bộ' },
        { value: 'proposal', label: 'Đề xuất / proposal' },
        { value: 'whitepaper', label: 'Whitepaper' },
        { value: 'policy', label: 'Quy định / policy' },
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
        { value: 'Letter', label: 'US Letter' },
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
    { key: 'summary', label: 'Tóm tắt điều hành', placeholder: '3–5 câu…', required: true, multiline: true },
    { key: 'sections', label: 'Các mục chính', placeholder: 'Mục 1\nMục 2', required: true, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Có mục lục, footnote, bảng số liệu…', required: false, multiline: true },
  ],

  landing: [
    { key: 'title', label: 'Headline', placeholder: 'Khóa học / sản phẩm…', required: true },
    {
      key: 'size',
      label: 'Ưu tiên thiết bị',
      placeholder: 'both',
      required: true,
      options: [
        { value: 'desktop', label: 'Desktop-first (1440+)' },
        { value: 'mobile', label: 'Mobile-first' },
        { value: 'both', label: 'Responsive cân bằng' },
      ],
    },
    {
      key: 'sectionsCount',
      label: 'Số section trang',
      placeholder: '5',
      required: true,
      options: [
        { value: '3', label: '3 — tối giản' },
        { value: '5', label: '5 — chuẩn' },
        { value: '7', label: '7 — đầy đủ' },
        { value: '9', label: '9 — long-form' },
      ],
    },
    {
      key: 'heroStyle',
      label: 'Kiểu hero',
      placeholder: 'split',
      required: false,
      options: [
        { value: 'full-bleed', label: 'Full-bleed ảnh nền' },
        { value: 'split', label: 'Chữ trái / ảnh phải' },
        { value: 'centered', label: 'Giữa, tối giản' },
        { value: 'video-bg', label: 'Hero kiểu video' },
      ],
    },
    { key: 'valueProp', label: 'Giá trị cốt lõi', placeholder: 'Vì sao chọn chúng tôi…', required: true, multiline: true },
    { key: 'socialProof', label: 'Social proof (tuỳ chọn)', placeholder: '1200 học viên · 4.9★…', required: false, multiline: true },
    { key: 'cta', label: 'CTA chính', placeholder: 'Đăng ký miễn phí', required: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Form lead, FAQ, so sánh gói…', required: false, multiline: true },
  ],

  newsletter: [
    { key: 'title', label: 'Tiêu đề bản tin', placeholder: 'Bản tin tháng 9', required: true },
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
        { value: 'digest', label: 'Digest nhiều tin' },
        { value: 'promo', label: 'Promo / ưu đãi' },
        { value: 'announcement', label: 'Thông báo 1 tin chính' },
        { value: 'nurture', label: 'Nuôi dưỡng lead' },
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
    { key: 'highlights', label: 'Tin / khối nổi bật', placeholder: 'Tin 1\nTin 2', required: true, multiline: true },
    { key: 'cta', label: 'CTA', placeholder: 'Đọc thêm', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Preheader, unsubscribe footer, dark-mode safe…', required: false, multiline: true },
  ],

  infographic: [
    { key: 'title', label: 'Chủ đề', placeholder: 'Thống kê tuyển sinh 2026', required: true },
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
        { value: 'icons-stats', label: 'Icon + số lớn' },
        { value: 'timeline', label: 'Timeline' },
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
    { key: 'stats', label: 'Số liệu (mỗi dòng 1)', placeholder: '1200 học viên\n95% hài lòng', required: true, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Nguồn số liệu, chú thích đơn vị, màu nhấn…', required: false, multiline: true },
  ],

  certificate: [
    { key: 'recipient', label: 'Người nhận', placeholder: 'Họ và tên', required: true },
    { key: 'achievement', label: 'Thành tích / khóa học', placeholder: 'Hoàn thành khóa…', required: true },
    { key: 'date', label: 'Ngày cấp', placeholder: '02/09/2026', required: true },
    {
      key: 'size',
      label: 'Khổ giấy',
      placeholder: 'A4-landscape',
      required: true,
      options: [
        { value: 'A4-landscape', label: 'A4 ngang' },
        { value: 'A4', label: 'A4 dọc' },
        { value: 'A3-landscape', label: 'A3 ngang' },
        { value: 'letter-landscape', label: 'Letter ngang' },
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
        { value: 'formal-seal', label: 'Trang trọng + dấu / seal' },
      ],
    },
    { key: 'signer', label: 'Người ký / chức danh', placeholder: 'Hiệu trưởng · …', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Số hiệu chứng chỉ, QR xác thực…', required: false, multiline: true },
  ],

  resume: [
    { key: 'fullName', label: 'Họ tên', placeholder: 'Nguyễn Văn A', required: true },
    { key: 'role', label: 'Vị trí mong muốn', placeholder: 'Giáo viên / Marketer…', required: true },
    {
      key: 'size',
      label: 'Khổ & độ dài',
      placeholder: 'A4',
      required: true,
      options: [
        { value: 'A4', label: 'A4 — 1 trang' },
        { value: 'A4-2', label: 'A4 — tối đa 2 trang' },
        { value: 'Letter', label: 'Letter — 1 trang' },
      ],
    },
    {
      key: 'layout',
      label: 'Bố cục CV',
      placeholder: 'single',
      required: true,
      options: [
        { value: 'single', label: '1 cột' },
        { value: 'sidebar', label: 'Sidebar trái (ảnh / skill)' },
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
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'ATS-friendly, không icon màu, ngôn ngữ Anh/Việt…', required: false, multiline: true },
  ],

  brochure: [
    { key: 'title', label: 'Tiêu đề brochure', placeholder: 'Chương trình đào tạo…', required: true },
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
        { value: 'DL', label: 'DL leaflet' },
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
    { key: 'offers', label: 'Ưu đãi / nội dung chính', placeholder: 'Điểm nổi bật…', required: true, multiline: true },
    { key: 'contact', label: 'Liên hệ', placeholder: 'Hotline / email / địa chỉ', required: true },
    { key: 'extraDetail', label: 'Chi tiết in ấn', placeholder: 'Bleed, giấy Couché, QR đăng ký…', required: false, multiline: true },
  ],

  event: [
    { key: 'title', label: 'Tên sự kiện', placeholder: 'Lễ tốt nghiệp 2026', required: true },
    { key: 'datetime', label: 'Thời gian', placeholder: '19:00 · 20/09/2026', required: true },
    { key: 'venue', label: 'Địa điểm', placeholder: 'Hội trường…', required: true },
    {
      key: 'size',
      label: 'Định dạng ấn phẩm',
      placeholder: 'A5',
      required: true,
      options: [
        { value: 'A5', label: 'A5 — thiệp mời' },
        { value: 'A6', label: 'A6 — thiệp nhỏ' },
        { value: 'A4', label: 'A4 — poster sự kiện' },
        { value: '1080x1920', label: 'Story digital' },
        { value: '1080x1080', label: 'Post vuông' },
        { value: 'ticket', label: 'Vé / ticket ngang' },
      ],
    },
    {
      key: 'eventAsset',
      label: 'Loại asset',
      placeholder: 'invite',
      required: true,
      options: [
        { value: 'invite', label: 'Thiệp mời' },
        { value: 'poster', label: 'Poster sự kiện' },
        { value: 'ticket', label: 'Vé vào cửa' },
        { value: 'agenda', label: 'Agenda / chương trình' },
        { value: 'badge', label: 'Name badge' },
      ],
    },
    { key: 'dressCode', label: 'Dress code / ghi chú', placeholder: 'Trang phục lịch sự…', required: false },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'RSVP link, map, MC, khách mời…', required: false, multiline: true },
  ],

  worksheet: [
    { key: 'title', label: 'Tên phiếu', placeholder: 'Phiếu ôn tập tuần 3', required: true },
    { key: 'grade', label: 'Lớp / trình độ', placeholder: 'Lớp 10', required: true },
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
    { key: 'tasks', label: 'Nội dung bài tập', placeholder: 'Bài 1…\nBài 2…', required: true, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Có đáp án riêng, thời gian làm 30p…', required: false, multiline: true },
  ],

  quiz: [
    { key: 'title', label: 'Tiêu đề quiz', placeholder: 'Kiểm tra nhanh chương 2', required: true },
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
    { key: 'questions', label: 'Gợi ý câu hỏi / chủ đề', placeholder: 'Câu 1…\nCâu 2…', required: true, multiline: true },
    { key: 'extraDetail', label: 'Chi tiết thêm', placeholder: 'Thời gian 20p, mỗi câu 1 điểm…', required: false, multiline: true },
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
  deck: 'Viết đúng số slide + tỷ lệ + mật độ đã chọn. Mỗi scene = 1 slide (tiêu đề + bullet ngắn).',
  poster: 'Copy poster đúng khổ/hướng/DPI: headline mạnh, CTA rõ, ít chữ, tôn trọng safe area.',
  video:
    'Storyboard đúng thời lượng (tối đa 3600s) và số cảnh/block. Mỗi scene: visualText + voiceoverText + duration (giây). Tổng duration ≈ thời lượng mục tiêu. Video dài (>10 phút) tổ chức theo chương/block, không nhồi quá nhiều chữ mỗi cảnh. Tôn trọng tỷ lệ, nhịp, voiceMode.',
  social: 'Caption + hashtag + CTA đúng platform, kích thước và loại post (single/carousel/story).',
  document: 'Cấu trúc tài liệu đúng loại + khổ + độ dài: tóm tắt điều hành rồi các mục luận điểm.',
  landing: 'Copy landing đúng số section + kiểu hero + thiết bị ưu tiên; có value prop và CTA.',
  newsletter: 'Bản tin đúng chiều rộng email, kiểu số và số khối; preheader ngầm trong tóm tắt nếu cần.',
  infographic: 'Điểm dữ liệu trực quan đúng số lượng + kiểu viz + khung kích thước.',
  certificate: 'Nội dung trang trọng đúng khổ giấy và mức trang trí; không marketing ồn.',
  resume: 'CV đúng bố cục/khổ; kỹ năng + kinh nghiệm ngắn, chuyên nghiệp.',
  brochure: 'Copy brochure đúng kiểu gấp và mặt ưu tiên; lợi ích + liên hệ rõ.',
  event: 'Thông tin sự kiện + đúng loại asset (thiệp/poster/vé) và kích thước.',
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
    'Trả JSON storyboard đúng schema hệ thống (scenes[]).',
    'Tuân thủ chính xác: thời lượng (tối đa 60 phút), số cảnh/block, kích thước, tỷ lệ, phong cách trong form.',
    'Video dài: chia chương/block; tổng duration các scene ≈ durationSec.',
    'Không markdown ngoài JSON.'
  )

  return lines.filter((l) => l !== undefined).join('\n').trim()
}
