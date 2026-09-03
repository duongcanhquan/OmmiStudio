export type BrandIndustry =
  | 'education'
  | 'commerce'
  | 'hospitality'
  | 'tech'
  | 'healthcare'
  | 'nonprofit'
  | 'general'

export const BRAND_INDUSTRY_LABELS: Record<BrandIndustry, string> = {
  education: 'Giáo dục',
  commerce: 'Thương mại',
  hospitality: 'Dịch vụ / nhà hàng khách sạn',
  tech: 'Công nghệ',
  healthcare: 'Y tế',
  nonprofit: 'Phi lợi nhuận',
  general: 'Đa ngành',
}

export interface BrandPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface BrandTypography {
  heading: string
  body: string
}

export interface BrandVoice {
  tone: string
  keywords: string[]
  doSay: string
  dontSay: string
}

export interface StudioBrand {
  id: string
  name: string
  description?: string
  industry: BrandIndustry
  accent?: string
  palette: BrandPalette
  typography: BrandTypography
  voice: BrandVoice
  path?: string
  custom?: boolean
  /** Data URL logo (nén, lưu localStorage cùng brand tùy chỉnh) */
  logoDataUrl?: string
  /** Tối đa 3 ảnh mặc định (cơ sở / sản phẩm) */
  photoDataUrls?: string[]
}

const STORAGE_KEY = 'omnistudio.customBrands.v1'

export const DEFAULT_BRAND_PRESETS: StudioBrand[] = [
  {
    id: 'viet-my-college',
    name: 'Việt Mỹ College',
    description: 'Bộ nhận diện giáo dục — chuyên nghiệp, thân thiện',
    industry: 'education',
    accent: '#2563eb',
    palette: {
      primary: '#1d4ed8',
      secondary: '#0ea5e9',
      accent: '#f59e0b',
      background: '#0f172a',
      text: '#f8fafc',
    },
    typography: {
      heading: 'Be Vietnam Pro',
      body: 'Inter',
    },
    voice: {
      tone: 'Thân thiện · truyền cảm hứng · rõ ràng',
      keywords: ['học tập', 'tương lai', 'đồng hành'],
      doSay: 'Cùng bạn kiến tạo tương lai',
      dontSay: 'Giọng quá bán hàng / phóng đại',
    },
    path: '(preset)',
  },
  {
    id: 'tram-thanh-xuan',
    name: 'Trạm Thanh Xuân',
    description: 'Thương hiệu địa phương / nhà hàng khách sạn ấm áp',
    industry: 'hospitality',
    accent: '#f59e0b',
    palette: {
      primary: '#b45309',
      secondary: '#fbbf24',
      accent: '#10b981',
      background: '#1c1917',
      text: '#fafaf9',
    },
    typography: {
      heading: 'Playfair Display',
      body: 'Source Sans 3',
    },
    voice: {
      tone: 'Ấm áp · gần gũi · chậm rãi',
      keywords: ['trải nghiệm', 'không gian', 'thanh xuân'],
      doSay: 'Chào đón như về nhà',
      dontSay: 'Ngôn ngữ công nghệ khô cứng',
    },
    path: '(preset)',
  },
  {
    id: 'default-neutral',
    name: 'Mặc định Trung tính',
    description: 'Hệ màu sạch khi chưa có DESIGN.md',
    industry: 'general',
    accent: '#94a3b8',
    palette: {
      primary: '#64748b',
      secondary: '#94a3b8',
      accent: '#22d3ee',
      background: '#020617',
      text: '#f1f5f9',
    },
    typography: {
      heading: 'DM Sans',
      body: 'DM Sans',
    },
    voice: {
      tone: 'Trung tính · súc tích · hiện đại',
      keywords: ['rõ ràng', 'tinh gọn'],
      doSay: 'Nói đúng trọng tâm',
      dontSay: 'Rườm rà, sáo rỗng',
    },
    path: '(preset)',
  },
  {
    id: 'edu-stem-lab',
    name: 'STEM Lab Edu',
    description: 'Giáo dục STEM — năng động, khoa học',
    industry: 'education',
    accent: '#8b5cf6',
    palette: {
      primary: '#7c3aed',
      secondary: '#06b6d4',
      accent: '#22c55e',
      background: '#0b1020',
      text: '#e2e8f0',
    },
    typography: {
      heading: 'Space Grotesk',
      body: 'IBM Plex Sans',
    },
    voice: {
      tone: 'Tò mò · logic · khích lệ',
      keywords: ['khám phá', 'thử nghiệm', 'sáng tạo'],
      doSay: 'Hãy thử và đo kết quả',
      dontSay: 'Đánh giá chủ quan',
    },
    custom: true,
    path: '(preset)',
  },
  {
    id: 'shop-local-mart',
    name: 'Local Mart',
    description: 'Thương mại bán lẻ — rõ ràng, khuyến mại',
    industry: 'commerce',
    accent: '#ef4444',
    palette: {
      primary: '#dc2626',
      secondary: '#f97316',
      accent: '#2563eb',
      background: '#111827',
      text: '#f9fafb',
    },
    typography: {
      heading: 'Montserrat',
      body: 'Roboto',
    },
    voice: {
      tone: 'Năng lượng · thẳng thắn · ưu đãi',
      keywords: ['ưu đãi', 'giá tốt', 'mua ngay'],
      doSay: 'Tiết kiệm hôm nay',
      dontSay: 'Cam kết mơ hồ',
    },
    custom: true,
    path: '(preset)',
  },
]

export function emptyBrandDraft(): StudioBrand {
  return {
    id: `brand-${Date.now()}`,
    name: '',
    description: '',
    industry: 'general',
    accent: '#22d3ee',
    palette: {
      primary: '#22d3ee',
      secondary: '#6366f1',
      accent: '#f59e0b',
      background: '#0f172a',
      text: '#f8fafc',
    },
    typography: {
      heading: 'Be Vietnam Pro',
      body: 'Inter',
    },
    voice: {
      tone: '',
      keywords: [],
      doSay: '',
      dontSay: '',
    },
    custom: true,
    path: '(custom)',
    logoDataUrl: undefined,
    photoDataUrls: [],
  }
}

export function loadCustomBrands(): StudioBrand[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StudioBrand[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomBrands(brands: StudioBrand[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands))
}

/** Merge API brands + presets + custom, ưu tiên custom theo id */
export function mergeBrandSources(
  apiBrands: Array<{
    id: string
    name: string
    description?: string
    accent?: string
    path?: string
  }>
): StudioBrand[] {
  const custom = loadCustomBrands()
  const byId = new Map<string, StudioBrand>()

  for (const p of DEFAULT_BRAND_PRESETS) {
    byId.set(p.id, p)
  }

  for (const b of apiBrands) {
    const existing = byId.get(b.id)
    if (existing) {
      byId.set(b.id, {
        ...existing,
        name: b.name || existing.name,
        description: b.description || existing.description,
        accent: b.accent || existing.accent,
        path: b.path || existing.path,
      })
    } else {
      byId.set(b.id, {
        id: b.id,
        name: b.name,
        description: b.description,
        industry: 'general',
        accent: b.accent || '#94a3b8',
        palette: {
          primary: b.accent || '#64748b',
          secondary: '#94a3b8',
          accent: '#22d3ee',
          background: '#0f172a',
          text: '#f8fafc',
        },
        typography: { heading: 'DM Sans', body: 'DM Sans' },
        voice: {
          tone: 'Trung tính',
          keywords: [],
          doSay: '',
          dontSay: '',
        },
        path: b.path,
      })
    }
  }

  for (const c of custom) {
    byId.set(c.id, { ...c, custom: true })
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'vi')
  )
}
