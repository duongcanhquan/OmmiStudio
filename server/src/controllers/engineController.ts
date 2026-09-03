import { Request, Response } from 'express';
import { normalizeStudioForm, type ContentType } from '../services/LLMService';
import {
  runGeneratePipeline,
  runPreviewPipeline,
} from '../services/PipelineService';
import { executeNexuPipeline } from '../services/NexuPipelineService';
import { workspaceService } from '../services/WorkspaceService';
import type { VietnameseVoiceRegion } from '../services/VoiceService';
import { parseParts, type StudioTemplateType } from '../services/scriptForm';
import type { BrandPaletteInput } from '../services/brandLook';
import { parseBrandMedia } from '../services/BrandMediaService';
import { resolveSkillBind } from '../config/studio-layouts';
import { skillBriefForTemplate } from '../services/HtmlSkillService';
import { externalAssetService } from '../services/ExternalAssetService';

export interface RenderHtmlBody {
  content: string;
  templateId: string;
}

export interface GenerateBody {
  prompt?: string;
  type: ContentType;
  voiceRegion?: VietnameseVoiceRegion;
  templateId?: string;
  templateType?: StudioTemplateType;
  layoutId?: string;
  layoutKind?: string;
  brandId?: string;
  /** Preferred motion-anything recipe / motionType */
  motionId?: string;
  /** local = tải về máy · drive = Google Drive */
  publishTarget?: 'local' | 'drive';
  fieldValues?: Record<string, string>;
  parts?: unknown;
  brandPalette?: BrandPaletteInput | null;
  brandMedia?: unknown;
}

const CONTENT_TYPES: ContentType[] = ['poster', 'video', 'slide'];
const VOICE_REGIONS: VietnameseVoiceRegion[] = ['north', 'south'];

const ASPECT_PIXELS: Record<string, string> = {
  '9:16': '1080x1920',
  '16:9': '1920x1080',
  '1:1': '1080x1080',
  '4:5': '1080x1350',
  '3:4': '1080x1440',
  '4:3': '1440x1080',
  '21:9': '1920x822',
};

function normalizeFieldValuesForPipeline(
  input?: Record<string, string>
): Record<string, string> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const next = { ...input };

  const durationRaw = next.duration?.trim() || next.durationSec?.trim() || '';
  if (durationRaw) {
    next.duration = durationRaw;
    next.durationSec = durationRaw;
  }

  const paperish = next.paper?.trim() || '';
  const sizeRaw = next.size?.trim() || '';
  if (!paperish && /^(A[345]|Letter)/i.test(sizeRaw)) {
    next.paper = sizeRaw;
  }
  if (!sizeRaw && paperish) {
    next.size = paperish;
  }

  const aspect = next.aspect?.trim() || '';
  if (aspect && ASPECT_PIXELS[aspect]) {
    const derived = ASPECT_PIXELS[aspect];
    const sizeIsPixels = /^\d+x\d+$/i.test(next.size ?? '');
    if (!sizeIsPixels) {
      next.size = derived;
    }
  }

  return next;
}

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
    templateType,
    layoutId,
    layoutKind,
    brandId,
    motionId,
    publishTarget = 'local',
    fieldValues,
    parts,
    brandPalette,
    brandMedia,
  } = req.body as Partial<GenerateBody>;

  const parsedParts = parseParts(parts);
  const hasPrompt = Boolean(prompt && typeof prompt === 'string' && prompt.trim());
  if (!hasPrompt && parsedParts.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Thiếu form kịch bản (cần các phần đã điền hoặc prompt).',
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
    const parsedBrandMedia = parseBrandMedia(brandMedia);
    const enrichedBrandMedia = await externalAssetService.enrichBrandMediaFromPrompt({
      brandMedia: parsedBrandMedia,
      templateType: templateType && typeof templateType === 'string' ? templateType : undefined,
      prompt: hasPrompt ? prompt!.trim() : '',
      fieldValues: normalizeFieldValuesForPipeline(
        fieldValues && typeof fieldValues === 'object' ? fieldValues : undefined
      ),
    });

    const result = await runGeneratePipeline({
      prompt: hasPrompt ? prompt!.trim() : '',
      type,
      voiceRegion: voiceRegion as VietnameseVoiceRegion,
      templateId: typeof templateId === 'string' ? templateId : undefined,
      templateType: typeof templateType === 'string' ? templateType : undefined,
      layoutId: typeof layoutId === 'string' ? layoutId : undefined,
      layoutKind: typeof layoutKind === 'string' ? layoutKind : undefined,
      brandId: typeof brandId === 'string' ? brandId : undefined,
      preferredMotion:
        typeof motionId === 'string' && motionId.trim()
          ? motionId.trim()
          : undefined,
      publishTarget: target,
      fieldValues: normalizeFieldValuesForPipeline(
        fieldValues && typeof fieldValues === 'object' ? fieldValues : undefined
      ),
      parts: parsedParts,
      brandPalette:
        brandPalette && typeof brandPalette === 'object' ? brandPalette : undefined,
      brandMedia: enrichedBrandMedia,
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
      message: result.degraded
        ? 'Xuất được bản HTML. MP4/PDF cần Chrome + FFmpeg trên máy — hệ thống sẽ thử lại khi bạn bấm Xuất. Vẫn có thể tải file HTML.'
        : result.uploadedToDrive
          ? 'File hoàn chỉnh đã lên Google Drive.'
          : 'File hoàn chỉnh đã sẵn sàng. Bấm Tải về khi bạn muốn.'
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
    templateType,
    layoutId,
    layoutKind,
    brandId,
    motionId,
    fieldValues,
    parts,
    brandPalette,
    brandMedia,
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
    const parsedBrandMedia = parseBrandMedia(brandMedia);
    const enrichedBrandMedia = await externalAssetService.enrichBrandMediaFromPrompt({
      brandMedia: parsedBrandMedia,
      templateType: templateType && typeof templateType === 'string' ? templateType : undefined,
      prompt: prompt?.trim() ?? '',
      fieldValues: normalizeFieldValuesForPipeline(
        fieldValues && typeof fieldValues === 'object' ? fieldValues : undefined
      ),
    });

    const result = await runPreviewPipeline({
      prompt: prompt.trim(),
      type: resolvedType,
      voiceRegion: 'south',
      templateId: typeof templateId === 'string' ? templateId : undefined,
      templateType: typeof templateType === 'string' ? templateType : undefined,
      layoutId: typeof layoutId === 'string' ? layoutId : undefined,
      layoutKind: typeof layoutKind === 'string' ? layoutKind : undefined,
      brandId: typeof brandId === 'string' ? brandId : undefined,
      preferredMotion:
        typeof motionId === 'string' && motionId.trim()
          ? motionId.trim()
          : undefined,
      fieldValues:
        normalizeFieldValuesForPipeline(
          fieldValues && typeof fieldValues === 'object' ? fieldValues : undefined
        ) ?? {},
      parts: parseParts(parts),
      brandPalette:
        brandPalette && typeof brandPalette === 'object' ? brandPalette : undefined,
      brandMedia: enrichedBrandMedia,
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
 * POST /api/v1/script/normalize — AI điền form từng phần, không render file.
 */
export async function normalizeScript(
  req: Request,
  res: Response
): Promise<void> {
  const {
    templateType,
    templateId,
    layoutId,
    brief,
    fieldValues,
    parts,
    brandName,
  } = req.body as {
    templateType?: StudioTemplateType;
    templateId?: string;
    layoutId?: string;
    brief?: string;
    fieldValues?: Record<string, string>;
    parts?: unknown;
    brandName?: string;
  };

  if (!templateType) {
    res.status(400).json({
      success: false,
      error: 'Thiếu loại mẫu để điền form.',
    });
    return;
  }

  try {
    const bind = resolveSkillBind(
      typeof templateId === 'string' ? templateId : undefined,
      typeof layoutId === 'string' ? layoutId : undefined
    );
    const skillBrief = await skillBriefForTemplate(
      typeof templateId === 'string' ? templateId : undefined,
      typeof layoutId === 'string' ? layoutId : undefined
    );
    const form = await normalizeStudioForm({
      templateType,
      brief: typeof brief === 'string' ? brief : '',
      fieldValues:
        fieldValues && typeof fieldValues === 'object' ? fieldValues : {},
      parts: parseParts(parts),
      skillBrief,
      fileLabel: bind?.fileLabel,
      purpose: bind?.purpose,
      brandName: typeof brandName === 'string' ? brandName : undefined,
    });
    res.status(200).json({
      success: true,
      title: form.title,
      fieldValues: form.fieldValues,
      parts: form.parts,
      message: 'AI đã điền form. Kiểm tra từng ô rồi xuất file.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[script/normalize]', message);
    // Linh hoạt: không chặn workflow khi AI không điền được form.
    const fallbackFieldValues =
      fieldValues && typeof fieldValues === 'object' ? fieldValues : {};
    const fallbackParts = parseParts(parts);

    res.status(422).json({
      success: false,
      title: fallbackFieldValues.title ?? '',
      fieldValues: fallbackFieldValues,
      parts: fallbackParts,
      error:
        `AI không điền form được. Giữ dữ liệu hiện tại và điền tay nếu cần. ` +
        `Chi tiết: ${message}`,
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
