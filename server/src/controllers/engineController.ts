import { Request, Response } from 'express';
import type { ContentType } from '../services/LLMService';
import {
  runGeneratePipeline,
  runPreviewPipeline,
} from '../services/PipelineService';
import { executeNexuPipeline } from '../services/NexuPipelineService';
import { workspaceService } from '../services/WorkspaceService';
import type { VietnameseVoiceRegion } from '../services/VoiceService';

export interface RenderHtmlBody {
  content: string;
  templateId: string;
}

export interface GenerateBody {
  prompt: string;
  type: ContentType;
  voiceRegion?: VietnameseVoiceRegion;
  templateId?: string;
  brandId?: string;
  /** Preferred motion-anything recipe / motionType */
  motionId?: string;
  /** local = tải về máy · drive = Google Drive */
  publishTarget?: 'local' | 'drive';
}

const CONTENT_TYPES: ContentType[] = ['poster', 'video', 'slide'];
const VOICE_REGIONS: VietnameseVoiceRegion[] = ['north', 'south'];

/**
 * POST /api/v1/generate
 * Body: { prompt, type, voiceRegion?, templateId?, brandId?, motionId? }
 */
export async function generate(req: Request, res: Response): Promise<void> {
  const {
    prompt,
    type,
    voiceRegion = 'south',
    templateId,
    brandId,
    motionId,
    publishTarget = 'local',
  } = req.body as Partial<GenerateBody>;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({
      success: false,
      error: 'Thiếu nội dung kịch bản (prompt không được trống).',
    });
    return;
  }

  if (!type || !CONTENT_TYPES.includes(type)) {
    res.status(400).json({
      success: false,
      error: `Loại nội dung không hợp lệ. Chọn một trong: ${CONTENT_TYPES.join(', ')}.`,
    });
    return;
  }

  if (!VOICE_REGIONS.includes(voiceRegion as VietnameseVoiceRegion)) {
    res.status(400).json({
      success: false,
      error: `Vùng giọng không hợp lệ. Chọn một trong: ${VOICE_REGIONS.join(', ')}.`,
    });
    return;
  }

  const target =
    publishTarget === 'drive' ? 'drive' : ('local' as 'local' | 'drive');

  try {
    const result = await runGeneratePipeline({
      prompt: prompt.trim(),
      type,
      voiceRegion: voiceRegion as VietnameseVoiceRegion,
      templateId: typeof templateId === 'string' ? templateId : undefined,
      brandId: typeof brandId === 'string' ? brandId : undefined,
      preferredMotion:
        typeof motionId === 'string' && motionId.trim()
          ? motionId.trim()
          : undefined,
      publishTarget: target,
    });

    res.status(200).json({
      success: true,
      type,
      voiceRegion,
      publishTarget: target,
      templateId: result.templateId,
      brandId: result.brandId,
      motionId: result.preferredMotion ?? null,
      finalOutputPath: result.finalOutputPath,
      driveUrl: result.driveUrl ?? null,
      driveFileId: result.driveFileId ?? null,
      uploadedToDrive: Boolean(result.uploadedToDrive),
      absoluteFinalPath: result.absoluteFinalPath,
      workspacePath: result.workspacePath,
      script: result.script,
      cliLogs: result.cliLogs,
      degraded: result.degraded,
      message: result.uploadedToDrive
        ? 'File hoàn chỉnh đã lên Google Drive.'
        : 'File hoàn chỉnh đã sẵn sàng — tải về máy.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[generate]', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

/**
 * POST /api/v1/generate/preview
 * Fast HTML preview for the Studio iframe (no MP4 / Drive).
 */
export async function generatePreview(
  req: Request,
  res: Response
): Promise<void> {
  const {
    prompt,
    type = 'slide',
    templateId,
    brandId,
    motionId,
  } = req.body as Partial<GenerateBody>;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({
      success: false,
      error: 'Thiếu nội dung kịch bản (prompt không được trống).',
    });
    return;
  }

  const resolvedType: ContentType = CONTENT_TYPES.includes(type as ContentType)
    ? (type as ContentType)
    : 'slide';

  try {
    const result = await runPreviewPipeline({
      prompt: prompt.trim(),
      type: resolvedType,
      voiceRegion: 'south',
      templateId: typeof templateId === 'string' ? templateId : undefined,
      brandId: typeof brandId === 'string' ? brandId : undefined,
      preferredMotion:
        typeof motionId === 'string' && motionId.trim()
          ? motionId.trim()
          : undefined,
    });

    res.status(200).json({
      success: true,
      previewUrl: result.previewUrl,
      workspacePath: result.workspacePath,
      script: result.script,
      templateId: result.templateId,
      brandId: result.brandId,
      motionId: result.preferredMotion ?? null,
      message: 'Đã sẵn sàng xem trước HTML.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[generate/preview]', message);
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}

/**
 * POST /api/engine/render-html — low-level html-anything job (legacy/direct)
 */
export async function renderHtml(req: Request, res: Response): Promise<void> {
  const { content, templateId } = req.body as Partial<RenderHtmlBody>;

  if (!content || typeof content !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Thiếu nội dung (content phải là chuỗi).',
    });
    return;
  }

  if (!templateId || typeof templateId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Thiếu mã mẫu (templateId phải là chuỗi).',
    });
    return;
  }

  let workspacePath: string | undefined;
  let keepWorkspace = false;

  try {
    workspacePath = await workspaceService.createWorkspace();

    const result = await executeNexuPipeline(
      { content, templateId },
      workspacePath,
      { tool: 'html-anything' }
    );

    keepWorkspace = true;
    res.status(200).json({
      success: true,
      workspacePath: result.workspaceDir,
      inputJsonPath: result.inputJsonPath,
      outputHtmlPath: result.outputHtmlPath,
      tool: result.tool,
      command: result.command,
      output: {
        stdout: result.execution.stdout,
        stderr: result.execution.stderr,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[render-html]', message);
    res.status(500).json({
      success: false,
      error: message,
      workspacePath: workspacePath ?? null,
    });
  } finally {
    if (workspacePath && !keepWorkspace) {
      try {
        await workspaceService.cleanup(workspacePath);
      } catch {
        // best-effort
      }
    }
  }
}
