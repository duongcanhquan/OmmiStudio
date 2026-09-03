import fs from 'fs/promises';
import path from 'path';
import { injectVietnameseFonts } from '../config/brand-assets';
import {
  assertCliExists,
  htmlAnythingCli,
  htmlVideoCli,
  motionAnythingCli,
} from '../config/nexu-tools';
import { execCommand, quoteShellArg } from '../utils/execCommand';
import {
  resolveVideoScript,
  type ContentType,
  type VideoScript,
} from './LLMService';
import {
  driveService,
  mimeFromPath,
  type DriveUploadResult,
} from './DriveService';
import {
  generateVietnameseVoiceover,
  type VietnameseVoiceRegion,
} from './VoiceService';
import { workspaceService } from './WorkspaceService';
import { saveProjectMeta } from './ProjectService';
import { renderLocalMp4 } from './LocalMp4Service';
import { buildBrandedHtml } from './BrandDocumentService';
import { renderBrandedPdf } from './PdfService';
import {
  exportKindForType,
  parseParts,
  partsToVideoScript,
  type ScriptPart,
} from './scriptForm';

export interface CliStepLog {
  stdout: string;
  stderr: string;
  command: string;
  ok: boolean;
  error?: string;
}

export interface PipelineOptions {
  prompt?: string;
  type: ContentType;
  voiceRegion: VietnameseVoiceRegion;
  templateId?: string;
  brandId?: string;
  /** Preferred motion recipe id / motionType applied across scenes */
  preferredMotion?: string;
  /**
   * local = giữ file trên máy (tải về Desktop qua UI)
   * drive = upload Google Drive (cần Settings Drive)
   */
  publishTarget?: 'local' | 'drive';
  templateType?: string;
  fieldValues?: Record<string, string>;
  parts?: ScriptPart[];
}

export interface PipelineResult {
  workspacePath: string;
  /** Local public path OR Google Drive webViewLink */
  finalOutputPath: string;
  absoluteFinalPath: string | null;
  driveUrl?: string;
  driveFileId?: string;
  script: VideoScript;
  audioFiles: string[];
  cliLogs: Record<string, CliStepLog>;
  degraded?: boolean;
  templateId?: string;
  brandId?: string;
  preferredMotion?: string;
  uploadedToDrive?: boolean;
}

export interface PreviewPipelineResult {
  workspacePath: string;
  previewUrl: string;
  script: VideoScript;
  templateId?: string;
  brandId?: string;
  preferredMotion?: string;
}

function nodeRunner(cliPath: string): string {
  const abs = path.resolve(cliPath);
  return abs.endsWith('.ts')
    ? `npx tsx ${quoteShellArg(abs)}`
    : `node ${quoteShellArg(abs)}`;
}

async function runCliStep(
  name: string,
  command: string,
  workspaceDir: string,
  timeout: number
): Promise<CliStepLog> {
  try {
    const result = await execCommand(command, {
      cwd: path.resolve(workspaceDir),
      timeout,
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      command,
      ok: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] ${name} failed (continuing if possible):\n`, message);
    return {
      stdout: '',
      stderr: message,
      command,
      ok: false,
      error: message,
    };
  }
}

export async function runHtmlAnything(
  inputHtml: string,
  outputHtml: string,
  workspaceDir: string
): Promise<CliStepLog> {
  try {
    assertCliExists('html-anything');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      stdout: '',
      stderr: message,
      command: 'html-anything',
      ok: false,
      error: message,
    };
  }
  const command = `${nodeRunner(htmlAnythingCli)} --input ${quoteShellArg(path.resolve(inputHtml))} --output ${quoteShellArg(path.resolve(outputHtml))}`;
  return runCliStep('html-anything', command, workspaceDir, 10 * 60 * 1000);
}

export async function runMotionAnything(
  inputHtml: string,
  outputHtml: string,
  workspaceDir: string
): Promise<CliStepLog> {
  try {
    assertCliExists('motion-anything');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      stdout: '',
      stderr: message,
      command: 'motion-anything',
      ok: false,
      error: message,
    };
  }
  const command = `${nodeRunner(motionAnythingCli)} --input ${quoteShellArg(path.resolve(inputHtml))} --output ${quoteShellArg(path.resolve(outputHtml))}`;
  return runCliStep('motion-anything', command, workspaceDir, 10 * 60 * 1000);
}

export async function runHtmlVideo(
  inputHtml: string,
  audioDir: string,
  outputMp4: string,
  workspaceDir: string
): Promise<CliStepLog> {
  try {
    assertCliExists('html-video');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      stdout: '',
      stderr: message,
      command: 'html-video',
      ok: false,
      error: message,
    };
  }
  const command = `${nodeRunner(htmlVideoCli)} --input ${quoteShellArg(path.resolve(inputHtml))} --audio ${quoteShellArg(path.resolve(audioDir))} --output ${quoteShellArg(path.resolve(outputMp4))}`;
  return runCliStep('html-video', command, workspaceDir, 20 * 60 * 1000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBaseHtml(
  script: VideoScript,
  prompt: string,
  templateId?: string,
  brandId?: string
): string {
  const scenesHtml = script.scenes
    .map(
      (scene) => `
  <section class="scene" data-scene-id="${scene.sceneId}" data-motion="${escapeHtml(scene.motionType)}" data-duration="${scene.duration}">
    <h2 class="visual-text">${escapeHtml(scene.visualText)}</h2>
    <p class="voiceover-text" hidden>${escapeHtml(scene.voiceoverText)}</p>
  </section>`
    )
    .join('\n');

  const raw = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(script.title || 'OmniStudio Video')}</title>
  <script id="omnistudio-script" type="application/json">${JSON.stringify({
    ...script,
    templateId,
    brandId,
  })}</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0b1220; color: #f8fafc; min-height: 100vh; }
    .meta { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,.08); opacity: .85; font-size: .9rem; }
    .scene { min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 3rem 1.5rem; text-align: center; }
    .visual-text { margin: 0; font-size: clamp(1.75rem, 4vw, 3rem); font-weight: 700; letter-spacing: -.02em; line-height: 1.25; max-width: 18ch; }
  </style>
</head>
<body>
  <header class="meta">
    <strong>OmniStudio</strong> · ${escapeHtml(script.title || 'Chưa đặt tên')}
    ${templateId ? ` · mẫu: ${escapeHtml(templateId)}` : ''}
    ${brandId ? ` · thương hiệu: ${escapeHtml(brandId)}` : ''}
  </header>
  <main id="scenes">
${scenesHtml}
  </main>
</body>
</html>`;

  return injectVietnameseFonts(raw);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

async function cleanupIntermediates(
  workspaceDir: string,
  keep: Set<string>
): Promise<void> {
  const entries = await fs.readdir(workspaceDir);
  for (const name of entries) {
    if (keep.has(name)) continue;
    await fs.rm(path.join(workspaceDir, name), { recursive: true, force: true });
  }
}

function toPublicWorkspacePath(workspaceDir: string, fileName: string): string {
  return `/workspaces/${path.basename(workspaceDir)}/${fileName}`;
}

function enrichPrompt(
  prompt: string,
  templateId?: string,
  brandId?: string,
  preferredMotion?: string
): string {
  const extras: string[] = [];
  if (templateId) extras.push(`Mã mẫu: ${templateId}`);
  if (brandId) extras.push(`Mã thương hiệu: ${brandId}`);
  if (preferredMotion) {
    extras.push(`Ưu tiên hiệu ứng «${preferredMotion}» cho cảnh mở / tiêu đề`);
  }
  if (extras.length === 0) return prompt;
  return `${prompt.trim()}\n\nRàng buộc:\n- ${extras.join('\n- ')}\n- Giữ giọng và màu sắc thương hiệu. Toàn bộ chữ trên hình phải là tiếng Việt.`;
}

function applyPreferredMotion(
  script: VideoScript,
  preferredMotion?: string
): VideoScript {
  if (!preferredMotion?.trim()) return script;
  const motion = preferredMotion.trim();
  return {
    ...script,
    scenes: script.scenes.map((scene, index) => ({
      ...scene,
      // Keep some variety on odd scenes if LLM already chose something else
      motionType:
        index === 0 || !scene.motionType || scene.motionType === 'fade-in'
          ? motion
          : scene.motionType,
    })),
  };
}

async function publishArtifact(
  absolutePath: string,
  publicLocalPath: string,
  publishTarget: 'local' | 'drive' = 'local'
): Promise<{
  finalOutputPath: string;
  absoluteFinalPath: string | null;
  drive?: DriveUploadResult;
  uploadedToDrive: boolean;
}> {
  if (publishTarget === 'drive') {
    if (!driveService.isConfigured()) {
      throw new Error(
        'Google Drive chưa được cấu hình. Vào Cài đặt → Lưu trữ đám mây (bật Drive, dán Service Account + Folder ID), hoặc chọn xuất ra máy này.'
      );
    }

    const fileName = path.basename(absolutePath);
    const mimeType = mimeFromPath(absolutePath);
    const drive = await driveService.uploadFile(
      absolutePath,
      fileName,
      mimeType
    );

    try {
      await fs.unlink(absolutePath);
    } catch (err) {
      console.warn(
        '[pipeline] uploaded to Drive but failed to delete local file:',
        err
      );
    }

    return {
      finalOutputPath: drive.webViewLink,
      absoluteFinalPath: null,
      drive,
      uploadedToDrive: true,
    };
  }

  // local — giữ artifact để tải về máy
  return {
    finalOutputPath: publicLocalPath,
    absoluteFinalPath: absolutePath,
    uploadedToDrive: false,
  };
}

export async function runVideoPipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const {
    prompt,
    voiceRegion = 'south',
    templateId,
    brandId,
    preferredMotion,
    publishTarget = 'local',
    fieldValues = {},
    parts: rawParts,
  } = options;

  const parts = parseParts(rawParts);
  const aspect = fieldValues.aspect ? `Tỷ lệ khung hình: ${fieldValues.aspect}` : '';
  const durationHint = Number(fieldValues.duration);
  const effectivePrompt = [prompt?.trim(), aspect].filter(Boolean).join('\n');

  if (!effectivePrompt && parts.length === 0) {
    throw new Error('runVideoPipeline: cần form từng phần hoặc kịch bản.');
  }

  const workspacePath = path.resolve(await workspaceService.createWorkspace());
  const cliLogs: PipelineResult['cliLogs'] = {};
  const audioFiles: string[] = [];
  let keepWorkspace = false;

  try {
    let script =
      parts.length > 0
        ? partsToVideoScript(
            fieldValues.title || '',
            parts,
            Number.isFinite(durationHint) ? durationHint : undefined
          )
        : await resolveVideoScript(
            effectivePrompt,
            'video',
            enrichPrompt(effectivePrompt, templateId, brandId, preferredMotion)
          );
    script = applyPreferredMotion(script, preferredMotion);
    await workspaceService.writeFile(workspacePath, 'script.json', {
      ...script,
      templateId,
      brandId,
      preferredMotion,
    });

    const audioDir = path.join(workspacePath, 'audio');
    await workspaceService.ensureDir(audioDir);

    for (const scene of script.scenes) {
      const spoken = scene.voiceoverText?.trim() || scene.visualText.trim();
      if (!spoken) continue;

      const outPath = path.join(audioDir, `scene_${scene.sceneId}.mp3`);
      try {
        await generateVietnameseVoiceover(spoken, outPath, voiceRegion);
        audioFiles.push(outPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[pipeline] TTS failed for scene ${scene.sceneId} (continuing):`,
          message
        );
        cliLogs[`tts-scene-${scene.sceneId}`] = {
          stdout: '',
          stderr: message,
          command: 'edge-tts',
          ok: false,
          error: message,
        };
      }
    }

    const indexHtmlPath = path.join(workspacePath, 'index.html');
    await fs.writeFile(
      indexHtmlPath,
      buildBaseHtml(script, effectivePrompt, templateId, brandId),
      'utf-8'
    );

    const finalMp4 = path.join(workspacePath, 'final.mp4');
    const previewHtml = path.join(workspacePath, 'preview.html');

    let absoluteArtifact = finalMp4;
    let finalName = 'final.mp4';
    let degraded = false;

    try {
        await renderLocalMp4({
          script,
          outputPath: finalMp4,
          audioDir,
          prompt: effectivePrompt,
          brandId,
          preferredMotion,
        });
      cliLogs['local-mp4'] = {
        stdout: 'Đã render MP4 chữ động (màu thương hiệu, chuyển động, nhạc nền).',
        stderr: '',
        command: 'ffmpeg-static',
        ok: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      cliLogs['local-mp4'] = {
        stdout: '',
        stderr: message,
        command: 'ffmpeg-static',
        ok: false,
        error: message,
      };
    }

    if (!(await fileExists(finalMp4))) {
      await fs.copyFile(indexHtmlPath, previewHtml);
      absoluteArtifact = previewHtml;
      finalName = 'preview.html';
      degraded = true;
    }

    await cleanupIntermediates(
      workspacePath,
      new Set([finalName, 'script.json', 'project.json'])
    );

    const published = await publishArtifact(
      absoluteArtifact,
      toPublicWorkspacePath(workspacePath, finalName),
      publishTarget
    );

    keepWorkspace = true;

    await saveProjectMeta(workspacePath, {
      title: script.title || fieldValues.title || effectivePrompt.slice(0, 80) || 'Video OmniStudio',
      type: 'video',
      kind: 'final',
      templateId,
      brandId,
      promptSnippet: effectivePrompt.slice(0, 200),
      createdAt: new Date().toISOString(),
      outputUrl: published.finalOutputPath,
      driveUrl: published.drive?.webViewLink ?? null,
      uploadedToDrive: published.uploadedToDrive,
      degraded,
      outputFileName: finalName,
    });

    return {
      workspacePath,
      finalOutputPath: published.finalOutputPath,
      absoluteFinalPath: published.absoluteFinalPath,
      driveUrl: published.drive?.webViewLink,
      driveFileId: published.drive?.fileId,
      script,
      audioFiles,
      cliLogs,
      degraded,
      templateId,
      brandId,
      preferredMotion,
      uploadedToDrive: published.uploadedToDrive,
    };
  } finally {
    if (!keepWorkspace) {
      try {
        await workspaceService.cleanup(workspacePath);
      } catch (cleanupErr) {
        console.error('[pipeline] workspace cleanup failed:', cleanupErr);
      }
    }
  }
}

/**
 * Fast Studio preview: LLM script → HTML (optional soft CLI polish). No TTS/MP4/Drive.
 */
export async function runPreviewPipeline(
  options: PipelineOptions
): Promise<PreviewPipelineResult> {
  const { prompt, type, templateId, brandId, preferredMotion } = options;
  if (!prompt?.trim()) {
    throw new Error('runPreviewPipeline: prompt is required.');
  }

  const workspacePath = path.resolve(await workspaceService.createWorkspace());
  let keepWorkspace = false;

  try {
    let script = await resolveVideoScript(
      prompt.trim(),
      type,
      enrichPrompt(prompt.trim(), templateId, brandId, preferredMotion)
    );
    script = applyPreferredMotion(script, preferredMotion);

    await workspaceService.writeFile(workspacePath, 'script.json', {
      ...script,
      templateId,
      brandId,
      preferredMotion,
      preview: true,
    });

    const indexHtmlPath = path.join(workspacePath, 'index.html');
    await fs.writeFile(
      indexHtmlPath,
      buildBaseHtml(script, prompt, templateId, brandId),
      'utf-8'
    );

    const layoutHtml = path.join(workspacePath, 'layout.html');
    try {
      await runHtmlAnything(indexHtmlPath, layoutHtml, workspacePath);
    } catch {
      // Soft-fail — preview still works from index.html
    }

    const motionHtml = path.join(workspacePath, 'motion.html');
    const motionInput = (await fileExists(layoutHtml))
      ? layoutHtml
      : indexHtmlPath;
    try {
      await runMotionAnything(motionInput, motionHtml, workspacePath);
    } catch {
      // Soft-fail
    }

    const previewName = 'preview.html';
    const previewAbs = path.join(workspacePath, previewName);
    const best =
      (await fileExists(motionHtml))
        ? motionHtml
        : (await fileExists(layoutHtml))
          ? layoutHtml
          : indexHtmlPath;
    await fs.copyFile(best, previewAbs);

    keepWorkspace = true;

    const previewUrl = toPublicWorkspacePath(workspacePath, previewName);
    await saveProjectMeta(workspacePath, {
      title: script.title || prompt.slice(0, 80) || 'Xem trước OmniStudio',
      type,
      kind: 'preview',
      templateId,
      brandId,
      promptSnippet: prompt.slice(0, 200),
      createdAt: new Date().toISOString(),
      outputUrl: previewUrl,
      outputFileName: previewName,
    });

    return {
      workspacePath,
      previewUrl,
      script,
      templateId,
      brandId,
      preferredMotion,
    };
  } finally {
    if (!keepWorkspace) {
      try {
        await workspaceService.cleanup(workspacePath);
      } catch (cleanupErr) {
        console.error('[pipeline] preview cleanup failed:', cleanupErr);
      }
    }
  }
}

export async function runGeneratePipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const {
    prompt = '',
    type,
    templateId,
    brandId,
    preferredMotion,
    publishTarget = 'local',
    templateType,
    fieldValues = {},
    parts: rawParts,
  } = options;

  const kind = exportKindForType(templateType);
  if (type === 'video' || kind === 'video') {
    return runVideoPipeline(options);
  }

  const parts = parseParts(rawParts);
  const workspacePath = path.resolve(await workspaceService.createWorkspace());
  let keepWorkspace = false;

  try {
    let script =
      parts.length > 0
        ? partsToVideoScript(fieldValues.title || '', parts)
        : await resolveVideoScript(
            prompt.trim(),
            type,
            enrichPrompt(prompt.trim(), templateId, brandId, preferredMotion)
          );
    script = applyPreferredMotion(script, preferredMotion);
    await workspaceService.writeFile(workspacePath, 'script.json', {
      ...script,
      templateId,
      brandId,
      preferredMotion,
      fieldValues,
      parts,
    });

    const title = fieldValues.title || script.title || 'OmniStudio';
    const htmlName = type === 'poster' ? 'poster.html' : 'slides.html';
    const htmlPath = path.join(workspacePath, htmlName);
    await fs.writeFile(
      htmlPath,
      buildBrandedHtml({
        title,
        parts,
        script,
        prompt,
        brandId,
        mode: kind === 'pdf' ? 'print' : type === 'poster' ? 'poster' : 'slides',
      }),
      'utf-8'
    );

    let artifactPath = htmlPath;
    let fileName = htmlName;
    if (kind === 'pdf') {
      fileName = 'document.pdf';
      artifactPath = path.join(workspacePath, fileName);
      await renderBrandedPdf({
        title,
        parts: parts.length
          ? parts
          : script.scenes.map((scene, index) => ({
              id: `scene-${index + 1}`,
              role: 'section',
              title: scene.visualText,
              body: scene.voiceoverText,
            })),
        outputPath: artifactPath,
        brandId,
        prompt,
        paper: fieldValues.paper,
      });
    }

    const published = await publishArtifact(
      artifactPath,
      toPublicWorkspacePath(workspacePath, fileName),
      publishTarget
    );

    keepWorkspace = true;

    await saveProjectMeta(workspacePath, {
      title,
      type,
      kind: 'final',
      templateId,
      brandId,
      promptSnippet: prompt.slice(0, 200),
      createdAt: new Date().toISOString(),
      outputUrl: published.finalOutputPath,
      driveUrl: published.drive?.webViewLink ?? null,
      uploadedToDrive: published.uploadedToDrive,
      outputFileName: fileName,
    });

    return {
      workspacePath,
      finalOutputPath: published.finalOutputPath,
      absoluteFinalPath: published.absoluteFinalPath,
      driveUrl: published.drive?.webViewLink,
      driveFileId: published.drive?.fileId,
      script,
      audioFiles: [],
      cliLogs: {},
      templateId,
      brandId,
      preferredMotion,
      uploadedToDrive: published.uploadedToDrive,
    };
  } finally {
    if (!keepWorkspace) {
      try {
        await workspaceService.cleanup(workspacePath);
      } catch (cleanupErr) {
        console.error('[pipeline] workspace cleanup failed:', cleanupErr);
      }
    }
  }
}

export const pipelineService = {
  runVideoPipeline,
  runGeneratePipeline,
  runPreviewPipeline,
  runHtmlAnything,
  runMotionAnything,
  runHtmlVideo,
};

export default pipelineService;
