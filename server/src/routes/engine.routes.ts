import { Router, type Router as ExpressRouter } from 'express';
import {
  generate,
  generatePreview,
  normalizeScript,
  renderHtml,
} from '../controllers/engineController';
import assetsRouter from './assets.routes';
import projectsRouter from './projects.routes';
import settingsRouter from './settings.routes';

const engineRouter: ExpressRouter = Router();
engineRouter.post('/render-html', renderHtml);

const v1Router: ExpressRouter = Router();
v1Router.post('/generate', generate);
v1Router.post('/generate/preview', generatePreview);
v1Router.post('/script/normalize', normalizeScript);
v1Router.use('/assets', assetsRouter);
v1Router.use('/projects', projectsRouter);
v1Router.use('/settings', settingsRouter);

export { engineRouter, v1Router };
export default engineRouter;
