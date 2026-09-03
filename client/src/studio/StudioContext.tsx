import { createContext, useContext } from 'react'
import type {
  ContentType,
  MotionRecipe,
  PublishTarget,
  TemplateMeta,
  VoiceRegion,
} from '../api/engine'
import type { StudioBrand } from '../lib/brands'
import { formIsReady, type ScriptPart } from '../lib/scriptForm'
import { type TemplateFilter } from '../lib/templateTypes'

export type StudioStep = 1 | 2 | 3 | 4 | 5

export type RenderPhase =
  | 'idle'
  | 'script'
  | 'html'
  | 'motion'
  | 'media'
  | 'publish'
  | 'done'
  | 'error'

export type { PublishTarget }

export interface StudioSelection {
  selectedTemplate: TemplateMeta | null
  selectedBrand: StudioBrand | null
  /** Bố cục nhìn thấy được — skill + chỗ chữ / số / CTA */
  layoutId?: string
  selectedMotion: MotionRecipe | null
  prompt: string
  /** Brief sáng tạo — AI viết theo ý này + mẫu + brand */
  aiBrief: string
  /** Ghi chú cấu trúc / logic kịch bản (cảnh, thứ tự, điểm nhấn) */
  scriptNotes: string
  richHtml: string
  fieldValues: Record<string, string>
  parts: ScriptPart[]
  voiceRegion: VoiceRegion
  contentType: ContentType
  /** Ảnh riêng bài này — nếu trống thì dùng ảnh trên thương hiệu */
  projectPhotos: string[]
}

/** Form đủ tiêu đề + ít nhất một phần có chữ. */
export function selectionHasContent(selection: StudioSelection): boolean {
  return formIsReady(
    selection.selectedTemplate?.type,
    selection.fieldValues,
    selection.parts
  ).ok
}

export interface StudioResult {
  resultUrl: string | null
  driveUrl: string | null
  uploadedToDrive: boolean
  message: string | null
  previewUrl: string | null
  degraded?: boolean
}

export interface StudioContextValue {
  step: StudioStep
  setStep: (step: StudioStep) => void
  selection: StudioSelection
  patchSelection: (patch: Partial<StudioSelection>) => void
  templates: TemplateMeta[]
  brands: StudioBrand[]
  motions: MotionRecipe[]
  assetsLoading: boolean
  assetsError: string | null
  templateFilter: TemplateFilter
  setTemplateFilter: (filter: TemplateFilter) => void
  previewLoading: boolean
  renderLoading: boolean
  renderPhase: RenderPhase
  result: StudioResult
  error: string | null
  generatePreview: () => Promise<void>
  finalRender: (target?: PublishTarget) => Promise<void>
  canGoNext: boolean
  goNext: () => void
  goBack: () => void
  upsertBrand: (brand: StudioBrand) => void
  removeBrand: (id: string) => void
  runAiAssist: () => Promise<void>
  aiAssistLoading: boolean
  /** Đích xuất bản đang chọn trên bước 4 */
  publishTarget: PublishTarget
  setPublishTarget: (target: PublishTarget) => void
  driveReady: boolean
}

export const StudioContext = createContext<StudioContextValue | null>(null)

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext)
  if (!ctx) {
    throw new Error('useStudio phải nằm trong StudioProvider')
  }
  return ctx
}
