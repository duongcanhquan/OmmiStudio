import { Router, type Router as ExpressRouter } from 'express';
import {
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
} from '../controllers/projectsController';

/**
 * Projects API — mounted at /api/v1/projects
 *
 * GET    /       → danh sách dự án từ workspaces
 * GET    /:id    → chi tiết
 * DELETE /:id    → xóa workspace
 */
const projectsRouter: ExpressRouter = Router();

projectsRouter.get('/', listProjectsHandler);
projectsRouter.get('/:id', getProjectHandler);
projectsRouter.delete('/:id', deleteProjectHandler);

export default projectsRouter;
