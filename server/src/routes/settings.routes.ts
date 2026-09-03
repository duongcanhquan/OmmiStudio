import { Router, type Router as ExpressRouter } from 'express';
import {
  getSettings,
  listOllamaModels,
  testDrive,
  testLlm,
  updateSettings,
} from '../controllers/settingsController';

/**
 * Settings API — mounted at /api/v1/settings
 *
 * GET  /                 → masked config
 * POST /                 → save config
 * GET  /ollama-models    → model đã pull trên Ollama local
 * POST /test-llm         → verify Gemini/Claude key
 * POST /test-drive       → verify Google Drive service account
 */
const settingsRouter: ExpressRouter = Router();

settingsRouter.get('/', getSettings);
settingsRouter.post('/', updateSettings);
settingsRouter.get('/ollama-models', listOllamaModels);
settingsRouter.post('/test-llm', testLlm);
settingsRouter.post('/test-drive', testDrive);

export default settingsRouter;
