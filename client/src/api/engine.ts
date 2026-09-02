import axios from 'axios'
import {
  inferTypeFromMeta,
  templateTypeToContentType,
  type TemplateType,
} from '../lib/templateTypes'

export type { TemplateType }
export type { TemplateFilter } from '../lib/templateTypes'
export {
  TEMPLATE_FILTERS,
  TEMPLATE_TYPE_LABELS,
  templateTypeToContentType,
  inferTypeFromMeta,
} from '../lib/templateTypes'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() || '/api/v1'

export type ContentType = 'video' | 'slide' | 'poster'
export type VoiceRegion = 'north' | 'south'

export type MotionCategory =
  | 'kinetic-text'
  | 'entrances'
  | 'backgrounds'
  | 'transitions'

export interface TemplateMeta {
  id: string
  name: string
  type: TemplateType
  thumbnail?: string | null
  description?: string
  mode?: string
  scenario?: string
  surface?: string
  path: string
}

export interface BrandMeta {
  id: string
  name: string
  description?: string
  accent?: string
  path: string
}

export interface MotionRecipe {
  id: string
  name: string
  category: MotionCategory
  categoryLabel: string
  description?: string
  motionType: string
}

export type PublishTarget = 'local' | 'drive'

export interface GeneratePayload {
  prompt: string
  type: ContentType
  voiceRegion?: VoiceRegion
  templateId?: string
  brandId?: string
  motionId?: string
  publishTarget?: PublishTarget
}

export interface GenerateResponse {
  success: boolean
  type?: ContentType
  voiceRegion?: VoiceRegion
  templateId?: string
  brandId?: string
  motionId?: string | null
  finalOutputPath?: string
  driveUrl?: string | null
  driveFileId?: string | null
  uploadedToDrive?: boolean
  absoluteFinalPath?: string | null
  workspacePath?: string
  script?: unknown
  message?: string
  error?: string
  degraded?: boolean
}

export interface PreviewResponse {
  success: boolean
  previewUrl?: string
  workspacePath?: string
  script?: unknown
  templateId?: string
  brandId?: string
  motionId?: string | null
  message?: string
  error?: string
}

export const engineApi = axios.create({
  baseURL: API_BASE,
  timeout: 20 * 60 * 1000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function generateContent(
  payload: GeneratePayload
): Promise<GenerateResponse> {
  const { data } = await engineApi.post<GenerateResponse>('/generate', {
    prompt: payload.prompt,
    type: payload.type,
    voiceRegion: payload.voiceRegion ?? 'south',
    templateId: payload.templateId,
    brandId: payload.brandId,
    motionId: payload.motionId,
    publishTarget: payload.publishTarget ?? 'local',
  })
  return data
}

export async function generatePreview(
  payload: Omit<GeneratePayload, 'voiceRegion'>
): Promise<PreviewResponse> {
  const { data } = await engineApi.post<PreviewResponse>('/generate/preview', {
    prompt: payload.prompt,
    type: payload.type,
    templateId: payload.templateId,
    brandId: payload.brandId,
    motionId: payload.motionId,
  })
  return data
}

export async function fetchTemplates(): Promise<TemplateMeta[]> {
  const { data } = await engineApi.get<{
    success: boolean
    templates: TemplateMeta[]
  }>('/assets/templates')
  return (data.templates ?? []).map((t) => ({
    ...t,
    type: inferTypeFromMeta(t),
  }))
}

export async function fetchBrands(): Promise<BrandMeta[]> {
  const { data } = await engineApi.get<{
    success: boolean
    brands: BrandMeta[]
  }>('/assets/brands')
  return data.brands ?? []
}

export async function fetchMotions(): Promise<MotionRecipe[]> {
  const { data } = await engineApi.get<{
    success: boolean
    motions: MotionRecipe[]
  }>('/assets/motions')
  return data.motions ?? []
}

export function resolveAssetUrl(finalOutputPath: string): string {
  if (/^https?:\/\//i.test(finalOutputPath)) return finalOutputPath
  return finalOutputPath.startsWith('/')
    ? finalOutputPath
    : `/${finalOutputPath}`
}

export function isDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /drive\.google\.com/i.test(url) || /^https?:\/\//i.test(url)
}

export { templateTypeToContentType as mapTemplateToContentType }
