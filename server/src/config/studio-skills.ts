/**
 * Mỗi mẫu Studio gắn đúng repo nexu:
 *   skillId          → html-anything example.html
 *   videoTemplateId  → html-video templates/ (MP4 thiết kế)
 *   motionRecipeId   → motion-anything recipes/ (CSS kinetic)
 * open-design DESIGN.md / tokens.css áp vào màu thương hiệu.
 * nexu (OpenClaw IM) không render file — chỉ catalog skill.
 */
export type SkillCapture =
  | 'page'
  | 'first-card'
  | 'packed-card'
  | 'all-cards'
  | 'print';

export interface StudioSkillBind {
  skillId: string;
  purpose: string;
  fileLabel: string;
  copyHint: string;
  capture: SkillCapture;
  videoTemplateId?: string;
  motionRecipeId?: string;
}

export const STUDIO_SKILL_MAP: Record<string, StudioSkillBind> = {
  'social-vuong': {
    skillId: 'deck-xhs-pastel',
    purpose: 'Ảnh kiến thức Instagram / Facebook / Zalo',
    fileLabel: 'ẢNH PNG',
    copyHint:
      'Một thẻ pastel đầy đủ: tiêu đề rất lớn (≤ 8 từ), 1 câu phụ, CTA. Không viết kịch bản video.',
    capture: 'first-card',
  },
  'social-story': {
    skillId: 'deck-xhs-white',
    purpose: 'Ảnh Story dọc 9:16 — tin 24 giờ',
    fileLabel: 'ẢNH PNG',
    copyHint:
      'Story dọc: 1 ý, chữ cực lớn, 1 dòng CTA. Không đoạn văn dài.',
    capture: 'first-card',
  },
  'social-carousel': {
    skillId: 'social-carousel',
    purpose: 'Nhiều ảnh kéo ngang Instagram / Facebook',
    fileLabel: 'ẢNH PNG',
    copyHint:
      'Đúng số khung. Mỗi part = một thẻ cinematic (tiêu đề ngắn + 1 caption).',
    capture: 'all-cards',
  },
  'video-ngang': {
    skillId: 'video-hyperframes',
    purpose: 'Video chữ động ngang — máy chiếu / YouTube',
    fileLabel: 'VIDEO MP4',
    copyHint:
      'Mỗi cảnh một câu ngắn. Trang html-video «liquid hero»: blob màu, chữ sáng, dòng chữ chạy. MP4 quay lại trang đó.',
    capture: 'page',
    videoTemplateId: 'frame-liquid-bg-hero',
    motionRecipeId: 'shiny-text',
  },
  'video-doc': {
    skillId: 'vfx-text-cursor',
    purpose: 'Video chữ động dọc — Reels / TikTok / Shorts',
    fileLabel: 'VIDEO MP4',
    copyHint:
      'Câu siêu ngắn, nhịp dọc. Trang html-video «vfx-text-cursor»: con trỏ, scramble, chữ chạy. MP4 quay lại trang đó.',
    capture: 'page',
    videoTemplateId: 'vfx-text-cursor',
    motionRecipeId: 'text-scramble',
  },
  'video-vox-collage': {
    skillId: 'video-hyperframes',
    purpose: 'Video explainer cắt giấy Vox — 16:9',
    fileLabel: 'VIDEO MP4',
    copyHint:
      'Mỗi cảnh = một poster cắt giấy (tiêu đề 2–3 từ, 1 câu phụ). Giấy rách, băng keo, chấm halftone, headline nướng vào ảnh. Hook ≤3s. Không quay người, không CGI.',
    capture: 'page',
  },
  'poster-mot-mat': {
    skillId: 'article-sketchnote-editorial',
    purpose: 'Poster / trang minh họa một mặt',
    fileLabel: 'POSTER HTML',
    copyHint:
      'Headline lớn + vài khối có hình minh họa. Ít chữ, tiêu đề đấm.',
    capture: 'page',
  },
  'deck-chuan': {
    skillId: 'deck-product-launch',
    purpose: 'Bài thuyết trình họp / giảng dạy',
    fileLabel: 'SLIDE HTML',
    copyHint:
      'Mỗi part = 1 slide: tiêu đề + 1–3 ý. Đúng số slide form.',
    capture: 'page',
  },
  'infographic-so-lieu': {
    skillId: 'live-dashboard',
    purpose: 'Sơ đồ số liệu — KPI, thẻ, biểu đồ',
    fileLabel: 'ĐỒ HỌA HTML',
    copyHint:
      'Số lớn, nhãn ngắn. Không bịa số liệu. Mỗi part một chỉ số / khối.',
    capture: 'page',
  },
  'document-a4': {
    skillId: 'doc-kami-parchment',
    purpose: 'Tài liệu / báo cáo in A4',
    fileLabel: 'PDF A4',
    copyHint:
      'Tóm tắt rồi các mục. Văn phong tài liệu, đủ câu.',
    capture: 'print',
  },
  'newsletter-email': {
    skillId: 'email-marketing',
    purpose: 'Bản tin gửi phụ huynh / học viên',
    fileLabel: 'PDF',
    copyHint:
      'Dòng mở + vài khối tin + CTA. Giọng bản tin, không slide.',
    capture: 'print',
  },
  'landing-dich': {
    skillId: 'web-proto-soft',
    purpose: 'Trang đích giới thiệu khóa / dịch vụ',
    fileLabel: 'TRANG HTML',
    copyHint:
      'Hero + preview + lợi ích + CTA. Mỗi part một khối trang đầy đủ.',
    capture: 'page',
  },
  'brochure-to-roi': {
    skillId: 'digital-eguide',
    purpose: 'Tờ rơi phát tay',
    fileLabel: 'PDF',
    copyHint:
      'Bìa: tên ấn phẩm. Trong: lợi ích / bước / liên hệ.',
    capture: 'print',
  },
  'event-su-kien': {
    skillId: 'waitlist-page',
    purpose: 'Trang / thiệp sự kiện (có chỗ logo)',
    fileLabel: 'PDF',
    copyHint:
      'Tên sự kiện, ngày giờ, địa điểm, CTA. Trang waitlist có ô logo — sau này dán file logo.',
    capture: 'page',
  },
  'certificate-giay': {
    skillId: 'magazine-poster',
    purpose: 'Chứng chỉ / giấy khen một trang',
    fileLabel: 'GIẤY HTML',
    copyHint:
      'Trang trọng: tên người nhận, lý do, đơn vị cấp. Không quảng cáo ồn. html-anything không có skill certificate riêng — dùng bố cục poster tạp chí một trang.',
    capture: 'page',
  },
  'resume-cv': {
    skillId: 'resume-modern',
    purpose: 'CV / hồ sơ ứng tuyển',
    fileLabel: 'PDF A4',
    copyHint:
      'Tên + vị trí, rồi các mục: giới thiệu, kinh nghiệm, kỹ năng. Gạch đầu dòng ngắn.',
    capture: 'print',
  },
  'worksheet-phieu': {
    skillId: 'meeting-notes',
    purpose: 'Phiếu bài tập in cho lớp',
    fileLabel: 'PDF',
    copyHint:
      'Mỗi part = một câu/bài. Để chỗ làm bài, không viết đáp án dài trừ khi user yêu cầu.',
    capture: 'print',
  },
  'quiz-cau-hoi': {
    skillId: 'deck-course-module',
    purpose: 'Bộ câu hỏi / kiểm tra',
    fileLabel: 'PDF',
    copyHint:
      'Mỗi part = một câu. Có thể ghi đáp án trong notes. Đúng số câu form.',
    capture: 'print',
  },
};

export function skillBindFor(templateId?: string): StudioSkillBind | null {
  if (!templateId) return null;
  return STUDIO_SKILL_MAP[templateId] ?? null;
}
