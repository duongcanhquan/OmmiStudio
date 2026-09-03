import {
  skillBindFor,
  type SkillCapture,
  type StudioSkillBind,
} from './studio-skills';

export interface StudioLayout {
  id: string;
  loaiId: string;
  name: string;
  blurb: string;
  skillId: string;
  capture: SkillCapture;
  videoTemplateId?: string;
  motionRecipeId?: string;
}

/** Nhiều bố cục cho một loại — user nhìn rồi chọn. */
export const STUDIO_LAYOUTS: StudioLayout[] = [
  {
    id: 'fb-pastel-hero',
    loaiId: 'social-vuong',
    name: 'Chữ lớn pastel',
    blurb: 'Badge góc trái · tiêu đề chiếm nửa trên · một từ nhấn · CTA dưới',
    skillId: 'deck-xhs-pastel',
    capture: 'first-card',
  },
  {
    id: 'fb-knowledge',
    loaiId: 'social-vuong',
    name: 'Kiến thức đánh số',
    blurb: 'Tiêu đề trên · 3 ý 01–03 · nút lưu đáy — bài dạy / mẹo',
    skillId: 'card-xiaohongshu',
    capture: 'packed-card',
  },
  {
    id: 'fb-checklist',
    loaiId: 'social-vuong',
    name: 'Checklist 4 việc',
    blurb: 'Tiêu đề · 4 dòng tick · dùng tuyển sinh / chuẩn bị / mẹo',
    skillId: 'card-xiaohongshu',
    capture: 'packed-card',
  },
  {
    id: 'fb-quote',
    loaiId: 'social-vuong',
    name: 'Trích dẫn giữa',
    blurb: 'Dấu ngoặc · một câu lớn · tên người nói dưới',
    skillId: 'deck-xhs-white',
    capture: 'first-card',
  },
  {
    id: 'fb-event-date',
    loaiId: 'social-vuong',
    name: 'Ngày sự kiện lớn',
    blurb: 'Số ngày rất lớn · tên sự kiện · địa điểm · nút đăng ký',
    skillId: 'waitlist-page',
    capture: 'page',
  },
  {
    id: 'fb-photo-word',
    loaiId: 'social-vuong',
    name: 'Ảnh nền + một chữ',
    blurb: 'Hình phủ nền · một từ khóa rất lớn đáy · caption nhỏ',
    skillId: 'social-carousel',
    capture: 'first-card',
  },
  {
    id: 'fb-magazine',
    loaiId: 'social-vuong',
    name: 'Bìa tạp chí',
    blurb: 'Headline chồng khối màu · vài dòng phụ bên phải',
    skillId: 'magazine-poster',
    capture: 'page',
  },
  {
    id: 'fb-offer',
    loaiId: 'social-vuong',
    name: 'Ưu đãi / giá',
    blurb: 'Badge sale · giá lớn · giá cũ gạch · CTA mua',
    skillId: 'poster-hero',
    capture: 'page',
  },
  {
    id: 'fb-product',
    loaiId: 'social-vuong',
    name: 'Ảnh trái · chữ phải',
    blurb: 'Khối ảnh · tên món / sản phẩm · giá hoặc CTA',
    skillId: 'social-carousel',
    capture: 'first-card',
  },
  {
    id: 'fb-menu',
    loaiId: 'social-vuong',
    name: 'Thực đơn ngắn',
    blurb: 'Tên quán · 3 món + giá · giữ chỗ đáy',
    skillId: 'deck-xhs-pastel',
    capture: 'first-card',
  },
  {
    id: 'fb-hours',
    loaiId: 'social-vuong',
    name: 'Giờ mở / đặt chỗ',
    blurb: 'Logo · khung giờ · địa chỉ · nút giữ chỗ / đặt lịch',
    skillId: 'waitlist-page',
    capture: 'page',
  },
  {
    id: 'fb-metric',
    loaiId: 'social-vuong',
    name: 'Một số lớn',
    blurb: 'KPI chiếm khung · nhãn ngắn · dùng thành tích / tác động',
    skillId: 'live-dashboard',
    capture: 'page',
  },
  {
    id: 'fb-feature',
    loaiId: 'social-vuong',
    name: 'Tính năng + khung UI',
    blurb: 'Chữ trái · khung giả điện thoại phải — ra mắt app / tool',
    skillId: 'mobile-onboarding',
    capture: 'page',
  },
  {
    id: 'fb-calm',
    loaiId: 'social-vuong',
    name: 'Mẹo chăm sóc',
    blurb: 'Nền dịu · 1 mẹo · 2 bước nhỏ · CTA đặt lịch',
    skillId: 'deck-xhs-white',
    capture: 'first-card',
  },
  {
    id: 'fb-trust',
    loaiId: 'social-vuong',
    name: 'Tin cậy / chứng nhận',
    blurb: 'Headline · 3 huy hiệu · dòng phụ — y tế / trường',
    skillId: 'magazine-poster',
    capture: 'page',
  },
  {
    id: 'story-white',
    loaiId: 'social-story',
    name: 'Story chữ trắng',
    blurb: 'Dọc 9:16 · một ý cực lớn giữa · CTA đáy',
    skillId: 'deck-xhs-white',
    capture: 'first-card',
  },
  {
    id: 'story-pastel',
    loaiId: 'social-story',
    name: 'Story pastel',
    blurb: 'Dọc · badge trên · tiêu đề nhấn · nền màu kem',
    skillId: 'deck-xhs-pastel',
    capture: 'first-card',
  },
  {
    id: 'story-offer',
    loaiId: 'social-story',
    name: 'Story ưu đãi',
    blurb: 'Dọc · badge sale · giá lớn · CTA đáy',
    skillId: 'poster-hero',
    capture: 'page',
  },
  {
    id: 'car-cinematic',
    loaiId: 'social-carousel',
    name: '3 thẻ cinematic',
    blurb: 'Mỗi khung một chữ lớn trên nền trời / đồng',
    skillId: 'social-carousel',
    capture: 'all-cards',
  },
  {
    id: 'car-xhs',
    loaiId: 'social-carousel',
    name: '3 thẻ kiến thức',
    blurb: 'Mỗi ý một màu · số lớn · vuốt ngang',
    skillId: 'card-xiaohongshu',
    capture: 'all-cards',
  },
  {
    id: 'vid-liquid',
    loaiId: 'video-ngang',
    name: 'Hero blob màu',
    blurb: 'Chữ giữa · nền blob chảy · dòng chữ chạy đáy',
    skillId: 'video-hyperframes',
    capture: 'page',
    videoTemplateId: 'frame-liquid-bg-hero',
    motionRecipeId: 'shiny-text',
  },
  {
    id: 'vid-warm',
    loaiId: 'video-ngang',
    name: 'Hạt ấm / kể chuyện',
    blurb: 'Nền grain ấm · chữ chậm — giáo dục / dịch vụ',
    skillId: 'video-hyperframes',
    capture: 'page',
    videoTemplateId: 'frame-warm-grain',
    motionRecipeId: 'shiny-text',
  },
  {
    id: 'vid-cursor',
    loaiId: 'video-doc',
    name: 'Con trỏ / scramble',
    blurb: 'Chữ dọc · con trỏ nhấp · từ giải mã — TikTok dạy học',
    skillId: 'vfx-text-cursor',
    capture: 'page',
    videoTemplateId: 'vfx-text-cursor',
    motionRecipeId: 'text-scramble',
  },
  {
    id: 'vid-kinetic',
    loaiId: 'video-doc',
    name: 'Chữ kinetic lớn',
    blurb: 'Từng từ đấm màn hình · nhịp nhanh',
    skillId: 'vfx-text-cursor',
    capture: 'page',
    videoTemplateId: 'frame-kinetic-type',
    motionRecipeId: 'shiny-text',
  },
  {
    id: 'vid-stat',
    loaiId: 'video-doc',
    name: 'Số liệu dọc',
    blurb: 'Một số rất lớn · nhãn · dùng thành tích / KPI',
    skillId: 'vfx-text-cursor',
    capture: 'page',
    videoTemplateId: 'frame-pentagram-stat',
    motionRecipeId: 'shiny-text',
  },
  {
    id: 'poster-sketch',
    loaiId: 'poster-mot-mat',
    name: 'Sketchnote minh họa',
    blurb: 'Headline + hình vẽ SVG xen chữ',
    skillId: 'article-sketchnote-editorial',
    capture: 'page',
  },
  {
    id: 'poster-mag',
    loaiId: 'poster-mot-mat',
    name: 'Poster tạp chí',
    blurb: 'Một mặt · chữ đấm · ít mục',
    skillId: 'magazine-poster',
    capture: 'page',
  },
  {
    id: 'poster-hero',
    loaiId: 'poster-mot-mat',
    name: 'Poster hero sự kiện',
    blurb: 'Ngày lớn · tên sự kiện · CTA',
    skillId: 'poster-hero',
    capture: 'page',
  },
  {
    id: 'deck-launch',
    loaiId: 'deck-chuan',
    name: 'Cover ra mắt',
    blurb: 'Slide bìa tối · chữ lớn · số trang',
    skillId: 'deck-product-launch',
    capture: 'page',
  },
  {
    id: 'deck-swiss',
    loaiId: 'deck-chuan',
    name: 'Lưới Swiss',
    blurb: 'Lưới chữ sạch · tiêu đề trái · ý phải',
    skillId: 'deck-swiss-international',
    capture: 'page',
  },
  {
    id: 'deck-course',
    loaiId: 'deck-chuan',
    name: 'Bài giảng / module',
    blurb: 'Số buổi · tiêu đề bài · 3 ý — giáo dục',
    skillId: 'deck-course-module',
    capture: 'page',
  },
  {
    id: 'info-dash',
    loaiId: 'infographic-so-lieu',
    name: 'Dashboard KPI',
    blurb: 'Số lớn · thẻ · biểu đồ',
    skillId: 'live-dashboard',
    capture: 'page',
  },
  {
    id: 'land-soft',
    loaiId: 'landing-dich',
    name: 'Landing mềm',
    blurb: 'Hero trái · khung preview phải · CTA',
    skillId: 'web-proto-soft',
    capture: 'page',
  },
  {
    id: 'land-saas',
    loaiId: 'landing-dich',
    name: 'Landing SaaS',
    blurb: 'Headline + lợi ích · khung sản phẩm',
    skillId: 'saas-landing',
    capture: 'page',
  },
  {
    id: 'event-wait',
    loaiId: 'event-su-kien',
    name: 'Trang sự kiện',
    blurb: 'Logo giữa · ngày giờ · nút giữ chỗ',
    skillId: 'waitlist-page',
    capture: 'page',
  },
  {
    id: 'doc-parchment',
    loaiId: 'document-a4',
    name: 'Báo cáo giấy',
    blurb: 'A4 · tiêu đề trên · các mục xuống dưới',
    skillId: 'doc-kami-parchment',
    capture: 'print',
  },
  {
    id: 'mail-digest',
    loaiId: 'newsletter-email',
    name: 'Bản tin khối',
    blurb: 'Dòng mở · vài khối tin · CTA đáy',
    skillId: 'email-marketing',
    capture: 'print',
  },
  {
    id: 'brochure-guide',
    loaiId: 'brochure-to-roi',
    name: 'Tờ rơi hướng dẫn',
    blurb: 'Bìa tên ấn phẩm · bên trong lợi ích / liên hệ',
    skillId: 'digital-eguide',
    capture: 'print',
  },
  {
    id: 'cert-magazine',
    loaiId: 'certificate-giay',
    name: 'Giấy khen một trang',
    blurb: 'Tên người nhận giữa · lý do · đơn vị cấp',
    skillId: 'magazine-poster',
    capture: 'page',
  },
  {
    id: 'cv-modern',
    loaiId: 'resume-cv',
    name: 'CV hai cột',
    blurb: 'Tên lớn · cột trái kỹ năng · cột phải kinh nghiệm',
    skillId: 'resume-modern',
    capture: 'print',
  },
  {
    id: 'sheet-notes',
    loaiId: 'worksheet-phieu',
    name: 'Phiếu có chỗ viết',
    blurb: 'Tiêu đề phiếu · từng câu · dòng kẻ làm bài',
    skillId: 'meeting-notes',
    capture: 'print',
  },
  {
    id: 'quiz-module',
    loaiId: 'quiz-cau-hoi',
    name: 'Câu hỏi từng trang',
    blurb: 'Mỗi khung một câu · chỗ chọn đáp án',
    skillId: 'deck-course-module',
    capture: 'print',
  },
];

export function defaultLayoutId(loaiId?: string): string | undefined {
  return layoutsForLoai(loaiId)[0]?.id;
}

export function layoutsForLoai(loaiId?: string): StudioLayout[] {
  if (!loaiId) return [];
  return STUDIO_LAYOUTS.filter((layout) => layout.loaiId === loaiId);
}

export function layoutById(layoutId?: string): StudioLayout | null {
  if (!layoutId) return null;
  return STUDIO_LAYOUTS.find((layout) => layout.id === layoutId) ?? null;
}

export function bindFromLayout(layout: StudioLayout): StudioSkillBind {
  return {
    skillId: layout.skillId,
    purpose: layout.name,
    fileLabel: 'THIẾT KẾ',
    copyHint: layout.blurb,
    capture: layout.capture,
    videoTemplateId: layout.videoTemplateId,
    motionRecipeId: layout.motionRecipeId,
  };
}

export function resolveSkillBind(
  templateId?: string,
  layoutId?: string
): StudioSkillBind | null {
  const layout = layoutById(layoutId);
  if (layout) return bindFromLayout(layout);
  return skillBindFor(templateId);
}
