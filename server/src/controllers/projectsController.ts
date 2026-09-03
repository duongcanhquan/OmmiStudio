import { Request, Response } from 'express';
import {
  deleteProject,
  getProject,
  listProjects,
} from '../services/ProjectService';

/** GET /api/v1/projects */
export async function listProjectsHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const projects = await listProjects();
    res.status(200).json({ success: true, projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** GET /api/v1/projects/:id */
export async function getProjectHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id || '');
    const project = await getProject(id);
    if (!project) {
      res.status(404).json({ success: false, error: 'Không tìm thấy dự án.' });
      return;
    }
    res.status(200).json({ success: true, project });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** DELETE /api/v1/projects/:id */
export async function deleteProjectHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id || '');
    const ok = await deleteProject(id);
    if (!ok) {
      res.status(404).json({ success: false, error: 'Không tìm thấy dự án.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Đã xóa dự án.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}
