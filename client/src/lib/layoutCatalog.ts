import type { BrandIndustry } from './brands'
import type { PreviewFrame } from './templateCatalog'

/** Style xếp chữ — lọc trong một loại, không phải ngành. */
export type LayoutStyle =
  | 'chu-lon'
  | 'danh-so'
  | 'anh'
  | 'tap-chi'
  | 'uu-dai'
  | 'su-kien'
  | 'so-lieu'
  | 'giao-dien'
  | 'cham-soc'
  | 'chuyen-dong'
  | 'giay'
  | 'cat-giay'

export const LAYOUT_STYLE_LABELS: Record<LayoutStyle, string> = {
  'chu-lon': 'Chữ lớn',
  'danh-so': 'Đánh số / list',
  anh: 'Ảnh + chữ',
  'tap-chi': 'Tạp chí / trích dẫn',
  'uu-dai': 'Ưu đãi / giá',
  'su-kien': 'Sự kiện / ngày',
  'so-lieu': 'Số liệu',
  'giao-dien': 'Giao diện / trang',
  'cham-soc': 'Giờ / tin cậy',
  'chuyen-dong': 'Chữ chạy',
  giay: 'Trang giấy',
  'cat-giay': 'Cắt giấy Vox',
}

/** Cách vẽ khung xem trước — khớp bố cục skill thật, không phải poster màu chung. */
export type LayoutKind =
  | 'pastel-hero'
  | 'knowledge'
  | 'photo-word'
  | 'magazine'
  | 'quote-center'
  | 'checklist'
  | 'event-date'
  | 'offer-price'
  | 'product-split'
  | 'menu-card'
  | 'hours-cta'
  | 'metric-hero'
  | 'feature-ui'
  | 'calm-tip'
  | 'trust-badge'
  | 'story-white'
  | 'story-pastel'
  | 'story-offer'
  | 'car-cinematic'
  | 'car-xhs'
  | 'vid-liquid'
  | 'vid-cursor'
  | 'vid-kinetic'
  | 'vid-stat'
  | 'vid-warm'
  | 'poster-sketch'
  | 'poster-mag'
  | 'poster-hero'
  | 'deck-launch'
  | 'deck-swiss'
  | 'deck-course'
  | 'info-dash'
  | 'land-soft'
  | 'land-saas'
  | 'event-wait'
  | 'sheet-doc'
  | 'sheet-email'
  | 'sheet-brochure'
  | 'cert-formal'
  | 'resume-col'
  | 'worksheet'
  | 'quiz'
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
  | 'vox-hook'

export interface StudioLayout {
  id: string
  loaiId: string
  name: string
  blurb: string
  kind: LayoutKind
  frame: PreviewFrame
  industries: BrandIndustry[]
  /** Từ được tô màu nhấn trên khung xem trước */
  accentWord?: string
}

const STYLE_BY_KIND: Record<LayoutKind, LayoutStyle> = {
  'pastel-hero': 'chu-lon',
  knowledge: 'danh-so',
  'photo-word': 'anh',
  magazine: 'tap-chi',
  'quote-center': 'tap-chi',
  checklist: 'danh-so',
  'event-date': 'su-kien',
  'offer-price': 'uu-dai',
  'product-split': 'anh',
  'menu-card': 'uu-dai',
  'hours-cta': 'cham-soc',
  'metric-hero': 'so-lieu',
  'feature-ui': 'giao-dien',
  'calm-tip': 'cham-soc',
  'trust-badge': 'cham-soc',
  'story-white': 'chu-lon',
  'story-pastel': 'chu-lon',
  'story-offer': 'uu-dai',
  'car-cinematic': 'anh',
  'car-xhs': 'danh-so',
  'vid-liquid': 'chuyen-dong',
  'vid-cursor': 'chuyen-dong',
  'vid-kinetic': 'chu-lon',
  'vid-stat': 'so-lieu',
  'vid-warm': 'chuyen-dong',
  'poster-sketch': 'chu-lon',
  'poster-mag': 'tap-chi',
  'poster-hero': 'su-kien',
  'deck-launch': 'chu-lon',
  'deck-swiss': 'danh-so',
  'deck-course': 'danh-so',
  'info-dash': 'so-lieu',
  'land-soft': 'giao-dien',
  'land-saas': 'giao-dien',
  'event-wait': 'su-kien',
  'sheet-doc': 'giay',
  'sheet-email': 'giay',
  'sheet-brochure': 'giay',
  'cert-formal': 'tap-chi',
  'resume-col': 'giay',
  worksheet: 'danh-so',
  quiz: 'danh-so',
  'vox-american-retro': 'cat-giay',
  'vox-swiss-modern': 'giao-dien',
  'vox-punk-zine': 'tap-chi',
  'vox-soviet': 'chu-lon',
  'vox-wpa': 'chu-lon',
  'vox-70s': 'cat-giay',
  'vox-ink': 'tap-chi',
  'vox-atomic': 'chuyen-dong',
  'vox-newsprint': 'tap-chi',
  'vox-deco': 'uu-dai',
  'vox-listicle': 'danh-so',
  'vox-timeline': 'su-kien',
  'vox-stat': 'so-lieu',
  'vox-hook': 'chu-lon',
}

export function styleOf(layout: StudioLayout): LayoutStyle {
  return STYLE_BY_KIND[layout.kind]
}

export const STUDIO_LAYOUTS: StudioLayout[] = [
  {
    id: 'fb-pastel-hero',
    loaiId: 'social-vuong',
    name: 'Chữ lớn pastel',
    blurb: 'Badge góc trái · tiêu đề chiếm nửa trên · một từ nhấn · CTA dưới',
    kind: 'pastel-hero',
    frame: 'square',
    industries: ['education', 'general', 'nonprofit'],
    accentWord: 'con',
  },
  {
    id: 'fb-knowledge',
    loaiId: 'social-vuong',
    name: 'Kiến thức đánh số',
    blurb: 'Tiêu đề trên · 3 ý 01–03 · nút lưu đáy — bài dạy / mẹo',
    kind: 'knowledge',
    frame: 'square',
    industries: ['education', 'healthcare', 'tech'],
  },
  {
    id: 'fb-checklist',
    loaiId: 'social-vuong',
    name: 'Checklist 4 việc',
    blurb: 'Tiêu đề · 4 dòng tick · dùng tuyển sinh / chuẩn bị / mẹo',
    kind: 'checklist',
    frame: 'square',
    industries: ['education', 'healthcare', 'commerce'],
  },
  {
    id: 'fb-quote',
    loaiId: 'social-vuong',
    name: 'Trích dẫn giữa',
    blurb: 'Dấu ngoặc · một câu lớn · tên người nói dưới',
    kind: 'quote-center',
    frame: 'square',
    industries: ['education', 'healthcare', 'nonprofit'],
  },
  {
    id: 'fb-event-date',
    loaiId: 'social-vuong',
    name: 'Ngày sự kiện lớn',
    blurb: 'Số ngày rất lớn · tên sự kiện · địa điểm · nút đăng ký',
    kind: 'event-date',
    frame: 'square',
    industries: ['education', 'hospitality', 'nonprofit'],
  },
  {
    id: 'fb-photo-word',
    loaiId: 'social-vuong',
    name: 'Ảnh nền + một chữ',
    blurb: 'Hình phủ nền · một từ khóa rất lớn đáy · caption nhỏ',
    kind: 'photo-word',
    frame: 'square',
    industries: ['hospitality', 'commerce', 'general'],
    accentWord: 'CHỌN',
  },
  {
    id: 'fb-magazine',
    loaiId: 'social-vuong',
    name: 'Bìa tạp chí',
    blurb: 'Headline chồng khối màu · vài dòng phụ bên phải',
    kind: 'magazine',
    frame: 'square',
    industries: ['commerce', 'hospitality', 'general'],
  },
  {
    id: 'fb-offer',
    loaiId: 'social-vuong',
    name: 'Ưu đãi / giá',
    blurb: 'Badge sale · giá lớn · giá cũ gạch · CTA mua',
    kind: 'offer-price',
    frame: 'square',
    industries: ['commerce', 'hospitality'],
  },
  {
    id: 'fb-product',
    loaiId: 'social-vuong',
    name: 'Ảnh trái · chữ phải',
    blurb: 'Khối ảnh · tên món / sản phẩm · giá hoặc CTA',
    kind: 'product-split',
    frame: 'square',
    industries: ['commerce', 'tech', 'hospitality'],
  },
  {
    id: 'fb-menu',
    loaiId: 'social-vuong',
    name: 'Thực đơn ngắn',
    blurb: 'Tên quán · 3 món + giá · giữ chỗ đáy',
    kind: 'menu-card',
    frame: 'square',
    industries: ['hospitality'],
  },
  {
    id: 'fb-hours',
    loaiId: 'social-vuong',
    name: 'Giờ mở / đặt chỗ',
    blurb: 'Logo · khung giờ · địa chỉ · nút giữ chỗ / đặt lịch',
    kind: 'hours-cta',
    frame: 'square',
    industries: ['hospitality', 'healthcare'],
  },
  {
    id: 'fb-metric',
    loaiId: 'social-vuong',
    name: 'Một số lớn',
    blurb: 'KPI chiếm khung · nhãn ngắn · dùng thành tích / tác động',
    kind: 'metric-hero',
    frame: 'square',
    industries: ['tech', 'education', 'nonprofit'],
  },
  {
    id: 'fb-feature',
    loaiId: 'social-vuong',
    name: 'Tính năng + khung UI',
    blurb: 'Chữ trái · khung giả điện thoại phải — ra mắt app / tool',
    kind: 'feature-ui',
    frame: 'square',
    industries: ['tech'],
  },
  {
    id: 'fb-calm',
    loaiId: 'social-vuong',
    name: 'Mẹo chăm sóc',
    blurb: 'Nền dịu · 1 mẹo · 2 bước nhỏ · CTA đặt lịch',
    kind: 'calm-tip',
    frame: 'square',
    industries: ['healthcare'],
  },
  {
    id: 'fb-trust',
    loaiId: 'social-vuong',
    name: 'Tin cậy / chứng nhận',
    blurb: 'Headline · 3 huy hiệu · dòng phụ — y tế / trường',
    kind: 'trust-badge',
    frame: 'square',
    industries: ['healthcare', 'education'],
  },
  {
    id: 'fb-vox-newsprint',
    loaiId: 'social-vuong',
    name: 'Cắt giấy bìa báo',
    blurb: 'Masthead · headline đặc · cột tin — explainer Vox vuông',
    kind: 'vox-newsprint',
    frame: 'square',
    industries: ['education', 'nonprofit', 'general'],
  },
  {
    id: 'fb-vox-punk',
    loaiId: 'social-vuong',
    name: 'Zine punk cắt giấy',
    blurb: 'Đen trắng + hồng điểm · chữ cắt ransom',
    kind: 'vox-punk-zine',
    frame: 'square',
    industries: ['commerce', 'general'],
  },
  {
    id: 'fb-vox-ink',
    loaiId: 'social-vuong',
    name: 'Mực tàu / ấn son',
    blurb: 'Giấy dó · tiêu đề lớn · ấn đỏ',
    kind: 'vox-ink',
    frame: 'square',
    industries: ['education', 'nonprofit'],
  },
  {
    id: 'story-white',
    loaiId: 'social-story',
    name: 'Story chữ trắng',
    blurb: 'Dọc 9:16 · một ý cực lớn giữa · CTA đáy',
    kind: 'story-white',
    frame: 'portrait',
    industries: ['education', 'general', 'nonprofit'],
  },
  {
    id: 'story-pastel',
    loaiId: 'social-story',
    name: 'Story pastel',
    blurb: 'Dọc · badge trên · tiêu đề nhấn · nền màu kem',
    kind: 'story-pastel',
    frame: 'portrait',
    industries: ['education', 'hospitality', 'healthcare'],
    accentWord: 'con',
  },
  {
    id: 'story-offer',
    loaiId: 'social-story',
    name: 'Story ưu đãi',
    blurb: 'Dọc · badge sale · giá lớn · CTA đáy',
    kind: 'story-offer',
    frame: 'portrait',
    industries: ['commerce', 'hospitality'],
  },
  {
    id: 'car-cinematic',
    loaiId: 'social-carousel',
    name: '3 thẻ cinematic',
    blurb: 'Mỗi khung một chữ lớn trên nền trời / đồng',
    kind: 'car-cinematic',
    frame: 'stack',
    industries: ['hospitality', 'commerce', 'general'],
  },
  {
    id: 'car-xhs',
    loaiId: 'social-carousel',
    name: '3 thẻ kiến thức',
    blurb: 'Mỗi ý một màu · số lớn · vuốt ngang',
    kind: 'car-xhs',
    frame: 'stack',
    industries: ['education', 'healthcare', 'tech'],
  },
  {
    id: 'vid-liquid',
    loaiId: 'video-ngang',
    name: 'Hero blob màu',
    blurb: 'Chữ giữa · nền blob chảy · dòng chữ chạy đáy',
    kind: 'vid-liquid',
    frame: 'landscape',
    industries: ['tech', 'general'],
  },
  {
    id: 'vid-warm',
    loaiId: 'video-ngang',
    name: 'Hạt ấm / kể chuyện',
    blurb: 'Nền grain ấm · chữ chậm — giáo dục / dịch vụ',
    kind: 'vid-warm',
    frame: 'landscape',
    industries: ['education', 'hospitality', 'healthcare'],
  },
  {
    id: 'vid-vox-swiss',
    loaiId: 'video-ngang',
    name: 'Cắt giấy Swiss ngang',
    blurb: 'Lưới 2 màu + đỏ · giấy rách · explainer 16:9',
    kind: 'vox-swiss-modern',
    frame: 'landscape',
    industries: ['tech', 'education', 'general'],
  },
  {
    id: 'vid-vox-news',
    loaiId: 'video-ngang',
    name: 'Cắt giấy bìa báo ngang',
    blurb: 'Masthead · headline · cột — Vox editorial',
    kind: 'vox-newsprint',
    frame: 'landscape',
    industries: ['education', 'nonprofit', 'general'],
  },
  {
    id: 'vid-cursor',
    loaiId: 'video-doc',
    name: 'Con trỏ / scramble',
    blurb: 'Chữ dọc · con trỏ nhấp · từ giải mã — TikTok dạy học',
    kind: 'vid-cursor',
    frame: 'portrait',
    industries: ['education', 'tech'],
  },
  {
    id: 'vid-kinetic',
    loaiId: 'video-doc',
    name: 'Chữ kinetic lớn',
    blurb: 'Từng từ đấm màn hình · nhịp nhanh',
    kind: 'vid-kinetic',
    frame: 'portrait',
    industries: ['education', 'commerce', 'general'],
  },
  {
    id: 'vid-stat',
    loaiId: 'video-doc',
    name: 'Số liệu dọc',
    blurb: 'Một số rất lớn · nhãn · dùng thành tích / KPI',
    kind: 'vid-stat',
    frame: 'portrait',
    industries: ['tech', 'education', 'nonprofit'],
  },
  {
    id: 'vid-vox-punk',
    loaiId: 'video-doc',
    name: 'Zine punk dọc',
    blurb: '9:16 · photocopy · chữ cắt — Reels / TikTok explainer',
    kind: 'vox-punk-zine',
    frame: 'portrait',
    industries: ['education', 'commerce', 'general'],
  },
  {
    id: 'vid-vox-ink',
    loaiId: 'video-doc',
    name: 'Mực tàu dọc',
    blurb: '9:16 · giấy dó · ấn son — kể chuyện văn hóa',
    kind: 'vox-ink',
    frame: 'portrait',
    industries: ['education', 'nonprofit'],
  },
  {
    id: 'poster-sketch',
    loaiId: 'poster-mot-mat',
    name: 'Sketchnote minh họa',
    blurb: 'Headline + hình vẽ SVG xen chữ',
    kind: 'poster-sketch',
    frame: 'portrait',
    industries: ['education', 'general'],
  },
  {
    id: 'poster-mag',
    loaiId: 'poster-mot-mat',
    name: 'Poster tạp chí',
    blurb: 'Một mặt · chữ đấm · ít mục',
    kind: 'poster-mag',
    frame: 'portrait',
    industries: ['commerce', 'hospitality'],
  },
  {
    id: 'poster-hero',
    loaiId: 'poster-mot-mat',
    name: 'Poster hero sự kiện',
    blurb: 'Ngày lớn · tên sự kiện · CTA',
    kind: 'poster-hero',
    frame: 'portrait',
    industries: ['education', 'nonprofit', 'hospitality'],
  },
  {
    id: 'poster-vox-collage',
    loaiId: 'poster-mot-mat',
    name: 'Poster cắt giấy Vox',
    blurb: 'Giấy rách · băng keo · headline nướng vào poster',
    kind: 'vox-hook',
    frame: 'portrait',
    industries: ['education', 'nonprofit', 'general'],
  },
  {
    id: 'deck-launch',
    loaiId: 'deck-chuan',
    name: 'Cover ra mắt',
    blurb: 'Slide bìa tối · chữ lớn · số trang',
    kind: 'deck-launch',
    frame: 'slides',
    industries: ['tech', 'commerce'],
  },
  {
    id: 'deck-swiss',
    loaiId: 'deck-chuan',
    name: 'Lưới Swiss',
    blurb: 'Lưới chữ sạch · tiêu đề trái · ý phải',
    kind: 'deck-swiss',
    frame: 'slides',
    industries: ['tech', 'general'],
  },
  {
    id: 'deck-course',
    loaiId: 'deck-chuan',
    name: 'Bài giảng / module',
    blurb: 'Số buổi · tiêu đề bài · 3 ý — giáo dục',
    kind: 'deck-course',
    frame: 'slides',
    industries: ['education'],
  },
  {
    id: 'info-dash',
    loaiId: 'infographic-so-lieu',
    name: 'Dashboard KPI',
    blurb: 'Số lớn · thẻ · biểu đồ',
    kind: 'info-dash',
    frame: 'portrait',
    industries: ['tech', 'education', 'nonprofit', 'general'],
  },
  {
    id: 'land-soft',
    loaiId: 'landing-dich',
    name: 'Landing mềm',
    blurb: 'Hero trái · khung preview phải · CTA',
    kind: 'land-soft',
    frame: 'landscape',
    industries: ['education', 'healthcare', 'hospitality'],
  },
  {
    id: 'land-saas',
    loaiId: 'landing-dich',
    name: 'Landing SaaS',
    blurb: 'Headline + lợi ích · khung sản phẩm',
    kind: 'land-saas',
    frame: 'landscape',
    industries: ['tech', 'commerce'],
  },
  {
    id: 'event-wait',
    loaiId: 'event-su-kien',
    name: 'Trang sự kiện',
    blurb: 'Logo giữa · ngày giờ · nút giữ chỗ',
    kind: 'event-wait',
    frame: 'square',
    industries: ['education', 'hospitality', 'nonprofit', 'general'],
  },
  {
    id: 'doc-parchment',
    loaiId: 'document-a4',
    name: 'Báo cáo giấy',
    blurb: 'A4 · tiêu đề trên · các mục xuống dưới',
    kind: 'sheet-doc',
    frame: 'sheet',
    industries: ['education', 'general'],
  },
  {
    id: 'mail-digest',
    loaiId: 'newsletter-email',
    name: 'Bản tin khối',
    blurb: 'Dòng mở · vài khối tin · CTA đáy',
    kind: 'sheet-email',
    frame: 'sheet',
    industries: ['education', 'commerce', 'nonprofit', 'general'],
  },
  {
    id: 'brochure-guide',
    loaiId: 'brochure-to-roi',
    name: 'Tờ rơi hướng dẫn',
    blurb: 'Bìa tên ấn phẩm · bên trong lợi ích / liên hệ',
    kind: 'sheet-brochure',
    frame: 'sheet',
    industries: ['education', 'hospitality', 'commerce'],
  },
  {
    id: 'cert-magazine',
    loaiId: 'certificate-giay',
    name: 'Giấy khen một trang',
    blurb: 'Tên người nhận giữa · lý do · đơn vị cấp',
    kind: 'cert-formal',
    frame: 'landscape',
    industries: ['education', 'healthcare', 'general'],
  },
  {
    id: 'cv-modern',
    loaiId: 'resume-cv',
    name: 'CV hai cột',
    blurb: 'Tên lớn · cột trái kỹ năng · cột phải kinh nghiệm',
    kind: 'resume-col',
    frame: 'sheet',
    industries: ['general', 'tech', 'education'],
  },
  {
    id: 'sheet-notes',
    loaiId: 'worksheet-phieu',
    name: 'Phiếu có chỗ viết',
    blurb: 'Tiêu đề phiếu · từng câu · dòng kẻ làm bài',
    kind: 'worksheet',
    frame: 'sheet',
    industries: ['education'],
  },
  {
    id: 'quiz-module',
    loaiId: 'quiz-cau-hoi',
    name: 'Câu hỏi từng trang',
    blurb: 'Mỗi khung một câu · chỗ chọn đáp án',
    kind: 'quiz',
    frame: 'sheet',
    industries: ['education'],
  },
  {
    id: 'vox-american-retro',
    loaiId: 'video-vox-collage',
    name: 'Mỹ retro / pulp',
    blurb: 'Chữ gỗ · burst · primaries — quảng cáo / thể thao',
    kind: 'vox-american-retro',
    frame: 'landscape',
    industries: ['commerce', 'general'],
  },
  {
    id: 'vox-swiss-modern',
    loaiId: 'video-vox-collage',
    name: 'Swiss / lưới sạch',
    blurb: 'Hai màu + đỏ · Helvetica · explainer kỹ thuật',
    kind: 'vox-swiss-modern',
    frame: 'landscape',
    industries: ['tech', 'education'],
  },
  {
    id: 'vox-punk-zine',
    loaiId: 'video-vox-collage',
    name: 'Zine punk photocopy',
    blurb: 'Đen trắng + một màu điểm · chữ cắt ransom',
    kind: 'vox-punk-zine',
    frame: 'landscape',
    industries: ['commerce', 'general'],
  },
  {
    id: 'vox-soviet',
    loaiId: 'video-vox-collage',
    name: 'Kiến tạo Xô viết',
    blurb: 'Đỏ / đen / kem · thanh chéo · chữ đặc',
    kind: 'vox-soviet',
    frame: 'landscape',
    industries: ['education', 'nonprofit'],
  },
  {
    id: 'vox-wpa',
    loaiId: 'video-vox-collage',
    name: 'Áp phích WPA',
    blurb: 'Ba màu trầm · stencil — lịch sử / y tế công',
    kind: 'vox-wpa',
    frame: 'landscape',
    industries: ['healthcare', 'education', 'nonprofit'],
  },
  {
    id: 'vox-70s',
    loaiId: 'video-vox-collage',
    name: '70s groovy',
    blurb: 'Mù tạt / gỉ / bơ · serif phồng · hạt riso',
    kind: 'vox-70s',
    frame: 'landscape',
    industries: ['hospitality', 'commerce'],
  },
  {
    id: 'vox-ink',
    loaiId: 'video-vox-collage',
    name: 'Mực tàu / ấn son',
    blurb: 'Giấy dó · chữ lớn · ấn đỏ',
    kind: 'vox-ink',
    frame: 'landscape',
    industries: ['education', 'nonprofit'],
  },
  {
    id: 'vox-atomic',
    loaiId: 'video-vox-collage',
    name: 'Atomic age',
    blurb: 'Teal / cam · boomerang — khoa học / tương lai',
    kind: 'vox-atomic',
    frame: 'landscape',
    industries: ['tech', 'education'],
  },
  {
    id: 'vox-newsprint',
    loaiId: 'video-vox-collage',
    name: 'Bìa báo editorial',
    blurb: 'Masthead · cột tin · explainer Vox cổ điển',
    kind: 'vox-newsprint',
    frame: 'landscape',
    industries: ['education', 'nonprofit', 'general'],
  },
  {
    id: 'vox-deco',
    loaiId: 'video-vox-collage',
    name: 'Art deco mạ vàng',
    blurb: 'Kem / vàng champagne · Didone — hàng xa xỉ',
    kind: 'vox-deco',
    frame: 'landscape',
    industries: ['hospitality', 'commerce'],
  },
  {
    id: 'vox-listicle',
    loaiId: 'video-vox-collage',
    name: 'Listicle giấy rách',
    blurb: '01–04 tờ giấy chồng · mẹo / xếp hạng',
    kind: 'vox-listicle',
    frame: 'landscape',
    industries: ['education', 'commerce'],
  },
  {
    id: 'vox-timeline',
    loaiId: 'video-vox-collage',
    name: 'Dòng thời gian cắt giấy',
    blurb: 'Các mốc nối ngang · tiến hóa / lịch sử',
    kind: 'vox-timeline',
    frame: 'landscape',
    industries: ['education', 'nonprofit'],
  },
  {
    id: 'vox-stat',
    loaiId: 'video-vox-collage',
    name: 'Số liệu cắt giấy',
    blurb: 'Một số khổng lồ trên tờ giấy · payoff',
    kind: 'vox-stat',
    frame: 'landscape',
    industries: ['tech', 'education', 'nonprofit'],
  },
  {
    id: 'vox-hook',
    loaiId: 'video-vox-collage',
    name: 'Hook banner rách',
    blurb: 'Headline 2–3 từ chiếm khung · mở ≤3s',
    kind: 'vox-hook',
    frame: 'landscape',
    industries: ['education', 'commerce', 'general'],
  },
]

export function layoutsForLoai(loaiId?: string): StudioLayout[] {
  if (!loaiId) return []
  return STUDIO_LAYOUTS.filter((layout) => layout.loaiId === loaiId)
}

export function stylesForLoai(loaiId?: string): LayoutStyle[] {
  const seen = new Set<LayoutStyle>()
  for (const layout of layoutsForLoai(loaiId)) {
    seen.add(styleOf(layout))
  }
  return (Object.keys(LAYOUT_STYLE_LABELS) as LayoutStyle[]).filter((id) =>
    seen.has(id)
  )
}

export function layoutsForLoaiStyle(
  loaiId?: string,
  style?: LayoutStyle | 'all'
): StudioLayout[] {
  const all = layoutsForLoai(loaiId)
  if (!style || style === 'all') return all
  return all.filter((layout) => styleOf(layout) === style)
}

export function layoutById(layoutId?: string | null): StudioLayout | null {
  if (!layoutId) return null
  return STUDIO_LAYOUTS.find((layout) => layout.id === layoutId) ?? null
}

export function defaultLayoutId(loaiId?: string): string | undefined {
  return layoutsForLoai(loaiId)[0]?.id
}
