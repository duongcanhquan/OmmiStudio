import { Request, Response } from 'express';
import {
  configManager,
  type AppSettings,
  type VoiceRegionSetting,
} from '../config/ConfigManager';
import { isValidProvider, LLM_PROVIDER_IDS } from '../config/llm-providers';
import { testLlmConnection } from '../services/LLMService';
import { driveService } from '../services/DriveService';

const VOICES: VoiceRegionSetting[] = ['north', 'south'];

/** GET /api/v1/settings */
export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await configManager.load();
    res.status(200).json({
      success: true,
      settings: configManager.toPublic(settings),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** POST /api/v1/settings */
export async function updateSettings(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const body = req.body as Partial<AppSettings>;
    if (!body || typeof body !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Dữ liệu cài đặt không hợp lệ.',
      });
      return;
    }

    if (body.llm?.provider && !isValidProvider(body.llm.provider)) {
      res.status(400).json({
        success: false,
        error: `Nhà cung cấp AI không hỗ trợ. Chọn: ${LLM_PROVIDER_IDS.join(', ')}`,
      });
      return;
    }

    if (
      body.system?.defaultVoice &&
      !VOICES.includes(body.system.defaultVoice)
    ) {
      res.status(400).json({
        success: false,
        error: `Giọng đọc không hợp lệ. Chọn: ${VOICES.join(', ')}`,
      });
      return;
    }

    const saved = await configManager.update(body);
    res.status(200).json({
      success: true,
      settings: configManager.toPublic(saved),
      message: 'Đã lưu cài đặt thành công.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** POST /api/v1/settings/test-llm */
export async function testLlm(req: Request, res: Response): Promise<void> {
  try {
    await configManager.load();
    const { apiKey, model, provider, baseUrl } = (req.body ?? {}) as {
      apiKey?: string;
      model?: string;
      provider?: string;
      baseUrl?: string;
    };

    const result = await testLlmConnection({
      apiKey,
      model,
      provider,
      baseUrl,
    });
    res.status(result.ok ? 200 : 400).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}

/** POST /api/v1/settings/test-drive */
export async function testDrive(req: Request, res: Response): Promise<void> {
  try {
    await configManager.load();
    const { serviceAccountJson, folderId } = (req.body ?? {}) as {
      serviceAccountJson?: string;
      folderId?: string;
    };

    const result = await driveService.testConnection({
      serviceAccountJson,
      folderId,
    });
    res.status(result.ok ? 200 : 400).json({
      success: result.ok,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ success: false, error: message });
  }
}
