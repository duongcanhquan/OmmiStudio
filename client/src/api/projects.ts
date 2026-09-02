import axios from 'axios'
import type { ContentType } from './engine'

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() || '/api/v1'

export type ProjectKind = 'final' | 'preview'

export interface ProjectMeta {
  id: string
  title: string
  type: ContentType
  kind: ProjectKind
  templateId?: string
  brandId?: string
  promptSnippet?: string
  createdAt: string
  updatedAt: string
  outputUrl: string
  driveUrl?: string | null
  uploadedToDrive?: boolean
  degraded?: boolean
  workspaceId: string
  outputFileName?: string
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

export async function fetchProjects(): Promise<ProjectMeta[]> {
  const { data } = await api.get<{ success: boolean; projects: ProjectMeta[] }>(
    '/projects'
  )
  return data.projects ?? []
}

export async function deleteProject(id: string): Promise<void> {
  const { data } = await api.delete<{ success: boolean; error?: string }>(
    `/projects/${encodeURIComponent(id)}`
  )
  if (!data.success) {
    throw new Error(data.error || 'Không xóa được dự án')
  }
}
