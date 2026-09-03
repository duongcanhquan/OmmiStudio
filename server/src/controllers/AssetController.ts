import { Request, Response } from 'express';
import {
  getAvailableBrands,
  getAvailableMotions,
  getAvailableTemplates,
} from '../services/AssetService';
import { listHtmlVideoTemplates } from '../services/HtmlVideoService';
import { probeNexuStack } from '../services/NexuStackService';

/**
 * Dynamic asset discovery for the Visual Creation Studio.
 * Scans local nexu-io tool directories (html-anything, open-design, motion-anything).
 */

/** GET /api/v1/assets/templates */
export async function listTemplates(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const templates = await getAvailableTemplates();
    res.status(200).json({ success: true, templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** GET /api/v1/assets/brands */
export async function listBrands(_req: Request, res: Response): Promise<void> {
  try {
    const brands = await getAvailableBrands();
    res.status(200).json({ success: true, brands });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** GET /api/v1/assets/motions */
export async function listMotions(_req: Request, res: Response): Promise<void> {
  try {
    const motions = await getAvailableMotions();
    const categories = Array.from(
      new Set(motions.map((m) => m.categoryLabel))
    ).sort();
    res.status(200).json({ success: true, motions, categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** GET /api/v1/assets/tools — 5 repo nexu-io + template html-video */
export async function listNexuTools(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const stack = probeNexuStack();
    const videoTemplates = await listHtmlVideoTemplates();
    res.status(200).json({ success: true, ...stack, videoTemplates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}
