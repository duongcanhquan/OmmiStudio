/**
 * Mỗi mẫu Studio gắn 1 skill html-anything (example.html + SKILL.md).
 * html-video / open-design chưa clone — không giả vờ gọi CLI.
 * motion-anything chỉ có list/gallery — video MP4 vẫn FFmpeg chữ động.
 */
export type SkillCapture = 'page' | 'first-card' | 'print';

export interface StudioSkillBind {
  skillId: string;
  purpose: string;
  fileLabel: string;
  copyHint: string;
  capture: SkillCapture;
}

export const STUDIO_SKILL_MAP: Record<string, StudioSkillBind> = {
  'social-vuong': {
    skillId: 'card-xiaohongshu',
    purpose: 'Ảnh kiến thức Instagram / Facebook / Zalo',
    fileLabel: 'ẢNH PNG',
    copyHint:
      'Một thẻ kiến thức: tiêu đề rất lớn (≤ 8 từ), 1 câu phụ, CTA ngắn. Không viết kịch bản video.',
    capture: 'first-card',
  },
  'social-story': {
    skillId: 'poster-hero',
    purpose: 'Ảnh Story dọc 9:16 — tin 24 giờ',
    fileLabel: 'ẢNH PNG',
    copyHint:
      'Story dọc: 1 ý, chữ cực lớn, 1 dòng CTA. Không đoạn văn dài.',
    capture: 'page',
  },
  'social-carousel': {
    skillId: 'social-carousel',
    purpose: 'Nhiều ảnh kéo ngang Instagram / Facebook',
    fileLabel: 'ẢNH PNG',
    copyHint:
      'Đúng số khung form. Mỗi khung một ý. Ba tiêu đề nối thành một câu nếu được.',
    capture: 'page',
  },
  'video-ngang': {
    skillId: 'video-hyperframes',
    purpose: 'Video chữ động ngang — máy chiếu / YouTube',
    fileLabel: 'VIDEO MP4',
    copyHint:
      'Chữ lên hình: mỗi cảnh một câu ngắn. File thật là MP4 FFmpeg, không phải phim quay.',
    capture: 'page',
  },
  'video-doc': {
    skillId: 'vfx-text-cursor',
    purpose: 'Video chữ động dọc — Reels / TikTok / Shorts',
    fileLabel: 'VIDEO MP4',
    copyHint:
      'Câu siêu ngắn, nhịp dọc. File thật là MP4 chữ động.',
    capture: 'page',
  },
  'poster-mot-mat': {
    skillId: 'magazine-poster',
    purpose: 'Poster một mặt — in hoặc đăng',
    fileLabel: 'POSTER HTML',
    copyHint:
      'Headline tạp chí + vài mục đánh số. Ít chữ, tiêu đề đấm.',
    capture: 'page',
  },
  'deck-chuan': {
    skillId: 'deck-swiss-international',
    purpose: 'Bài thuyết trình họp / giảng dạy',
    fileLabel: 'SLIDE HTML',
    copyHint:
      'Mỗi part = 1 slide: tiêu đề + 1–3 ý. Đúng số slide form.',
    capture: 'page',
  },
  'infographic-so-lieu': {
    skillId: 'data-report',
    purpose: 'Sơ đồ số liệu — ít chữ, số lớn',
    fileLabel: 'ĐỒ HỌA HTML',
    copyHint:
      'Số lớn, nhãn ngắn. Không bịa số liệu. Mỗi part một chỉ số.',
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
    skillId: 'saas-landing',
    purpose: 'Trang đích giới thiệu khóa / dịch vụ',
    fileLabel: 'TRANG HTML',
    copyHint:
      'Hero + lợi ích + CTA đăng ký. Mỗi part một khối trang.',
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
    skillId: 'poster-hero',
    purpose: 'Thiệp / poster sự kiện',
    fileLabel: 'PDF',
    copyHint:
      'Tên sự kiện, ngày giờ, địa điểm, CTA. Không viết báo cáo.',
    capture: 'print',
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
