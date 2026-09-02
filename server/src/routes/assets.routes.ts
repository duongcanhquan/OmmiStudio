import { Router, type Router as ExpressRouter } from 'express';
import {
  listBrands,
  listMotions,
  listTemplates,
} from '../controllers/AssetController';

/**
 * Asset discovery API — mounted at /api/v1/assets
 *
 * GET /templates → html-anything skills
 * GET /brands    → open-design design-systems
 * GET /motions   → motion-anything recipes
 */
const assetsRouter: ExpressRouter = Router();

assetsRouter.get('/templates', listTemplates);
assetsRouter.get('/brands', listBrands);
assetsRouter.get('/motions', listMotions);

export default assetsRouter;
