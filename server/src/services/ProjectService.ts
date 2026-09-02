import fs from 'fs/promises';
import path from 'path';
import type { ContentType } from './LLMService';

export type ProjectKind = 'final' | 'preview';

export interface ProjectMeta {
  id: string;
  title: string;
  type: ContentType;
  kind: ProjectKind;
  templateId?: string;
  brandId?: string;
  promptSnippet?: string;
  createdAt: string;
  updatedAt: string;
  /** Public path or Drive URL */
  outputUrl: string;
  driveUrl?: string | null;
  uploadedToDrive?: boolean;
  degraded?: boolean;
  workspaceId: string;
  outputFileName?: string;
}

const WORKSPACES_ROOT = path.resolve(__dirname, '../../workspaces');
const META_FILE = 'project.json';

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function inferOutput(
  workspacePath: string,
  entries: string[]
): { fileName: string; url: string } | null {
  const preferred = [
    'final.mp4',
    'preview.html',
    'slides.html',
    'poster.html',
    'motion.html',
    'layout.html',
    'index.html',
  ];
  for (const name of preferred) {
    if (entries.includes(name)) {
      return {
        fileName: name,
        url: `/workspaces/${path.basename(workspacePath)}/${name}`,
      };
    }
  }
  const html = entries.find((e) => e.endsWith('.html'));
  if (html) {
    return {
      fileName: html,
      url: `/workspaces/${path.basename(workspacePath)}/${html}`,
    };
  }
  return null;
}

/**
 * Persist project card metadata into the workspace folder.
 */
export async function saveProjectMeta(
  workspacePath: string,
  partial: Omit<ProjectMeta, 'id' | 'workspaceId' | 'updatedAt'> & {
    id?: string;
    updatedAt?: string;
  }
): Promise<ProjectMeta> {
  const workspaceId = path.basename(workspacePath);
  const now = new Date().toISOString();
  const meta: ProjectMeta = {
    id: partial.id ?? workspaceId,
    title: partial.title || 'Dự án không tên',
    type: partial.type,
    kind: partial.kind,
    templateId: partial.templateId,
    brandId: partial.brandId,
    promptSnippet: partial.promptSnippet,
    createdAt: partial.createdAt || now,
    updatedAt: now,
    outputUrl: partial.outputUrl,
    driveUrl: partial.driveUrl ?? null,
    uploadedToDrive: partial.uploadedToDrive,
    degraded: partial.degraded,
    workspaceId,
    outputFileName: partial.outputFileName,
  };

  await fs.mkdir(workspacePath, { recursive: true });
  await fs.writeFile(
    path.join(workspacePath, META_FILE),
    JSON.stringify(meta, null, 2),
    'utf-8'
  );
  return meta;
}

/**
 * Scan workspaces and return project cards (newest first).
 */
export async function listProjects(): Promise<ProjectMeta[]> {
  let dirs: string[] = [];
  try {
    const entries = await fs.readdir(WORKSPACES_ROOT, { withFileTypes: true });
    dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }

  const projects: ProjectMeta[] = [];

  for (const name of dirs) {
    if (name.startsWith('.')) continue;
    const folder = path.join(WORKSPACES_ROOT, name);
    const metaPath = path.join(folder, META_FILE);

    try {
      if (await fileExists(metaPath)) {
        const raw = await fs.readFile(metaPath, 'utf-8');
        const parsed = JSON.parse(raw) as ProjectMeta;
        projects.push({
          ...parsed,
          id: parsed.id || name,
          workspaceId: name,
        });
        continue;
      }

      // Legacy workspace without project.json — synthesize from script.json
      const scriptPath = path.join(folder, 'script.json');
      const entries = await fs.readdir(folder);
      const output = inferOutput(folder, entries);
      if (!output && !(await fileExists(scriptPath))) continue;

      let title = `Workspace ${name.slice(-8)}`;
      let type: ContentType = 'slide';
      let templateId: string | undefined;
      let brandId: string | undefined;
      let kind: ProjectKind = 'preview';
      let createdAt = nowFromFolderName(name);

      if (await fileExists(scriptPath)) {
        try {
          const script = JSON.parse(
            await fs.readFile(scriptPath, 'utf-8')
          ) as {
            title?: string;
            templateId?: string;
            brandId?: string;
            preview?: boolean;
            scenes?: unknown[];
          };
          if (script.title) title = script.title;
          templateId = script.templateId;
          brandId = script.brandId;
          kind = script.preview ? 'preview' : 'final';
          if (entries.includes('final.mp4')) {
            type = 'video';
            kind = 'final';
          } else if (entries.includes('poster.html')) {
            type = 'poster';
          }
        } catch {
          // ignore
        }
      }

      if (entries.includes('final.mp4')) {
        type = 'video';
        kind = 'final';
      }

      projects.push({
        id: name,
        title,
        type,
        kind,
        templateId,
        brandId,
        createdAt,
        updatedAt: createdAt,
        outputUrl: output?.url || `/workspaces/${name}/`,
        workspaceId: name,
        outputFileName: output?.fileName,
      });
    } catch {
      // skip broken folders
    }
  }

  projects.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );
  return projects;
}

function nowFromFolderName(name: string): string {
  const ts = Number(name.split('-')[0]);
  if (Number.isFinite(ts) && ts > 0) {
    return new Date(ts).toISOString();
  }
  return new Date().toISOString();
}

export async function getProject(
  workspaceId: string
): Promise<ProjectMeta | null> {
  const safe = path.basename(workspaceId);
  const folder = path.join(WORKSPACES_ROOT, safe);
  const metaPath = path.join(folder, META_FILE);
  if (!(await fileExists(folder))) return null;

  if (await fileExists(metaPath)) {
    const parsed = JSON.parse(
      await fs.readFile(metaPath, 'utf-8')
    ) as ProjectMeta;
    return { ...parsed, workspaceId: safe, id: parsed.id || safe };
  }

  const all = await listProjects();
  return all.find((p) => p.workspaceId === safe) ?? null;
}

export async function deleteProject(workspaceId: string): Promise<boolean> {
  const safe = path.basename(workspaceId);
  const folder = path.join(WORKSPACES_ROOT, safe);
  const root = path.resolve(WORKSPACES_ROOT);
  const resolved = path.resolve(folder);
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Đường dẫn dự án không hợp lệ.');
  }
  if (!(await fileExists(resolved))) return false;
  await fs.rm(resolved, { recursive: true, force: true });
  return true;
}

export const projectService = {
  saveProjectMeta,
  listProjects,
  getProject,
  deleteProject,
  workspacesRoot: WORKSPACES_ROOT,
  metaFile: META_FILE,
};

export default projectService;
