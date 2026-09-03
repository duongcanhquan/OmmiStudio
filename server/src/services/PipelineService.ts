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
import {
  assembleVideoClips,
  parseVideoSize,
  renderLocalMp4,
} from './LocalMp4Service';
import { fillHtmlVideoTemplate } from './HtmlVideoService';
import { recordHtmlToMp4 } from './HtmlRecordService';
import { renderSocialPngs } from './LocalPngService';
import {
  buildBrandedHtml,
  buildSocialGraphicHtml,
  type BrandPaletteInput,
} from './BrandDocumentService';
import {
  countSkillCards,
  fillStudioSkillHtml,
  isolateSkillCard,
} from './HtmlSkillService';
import { resolveSkillBind } from '../config/studio-layouts';
import { zipFiles } from './LocalPngService';
import { renderBrandedPdf } from './PdfService';
import {
  hasChromeCapture,
  printHtmlToPdf,
  screenshotHtml,
} from './ChromeCaptureService';
import { parseSocialSize } from './LocalPngService';
import {
  clampSceneDuration,
  durationHintFromFields,
  exportKindForType,
  parseParts,
  partsToVideoScript,
  type ScriptPart,
} from './scriptForm';
import { injectBrandMedia, type BrandMedia } from './BrandMediaService';
import { renderLayoutMatchHtml } from './LayoutMatchHtml';
import { resolveBrandLook } from './brandLook';

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
  layoutId?: string;
  layoutKind?: string;
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
  brandPalette?: BrandPaletteInput | null;
  brandMedia?: BrandMedia | null;
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

function htmlForChosenLayout(
  options: PipelineOptions,
  title: string,
  parts: ScriptPart[],
  prompt?: string
): string | null {
  const html = renderLayoutMatchHtml({
    layoutId: options.layoutId,
    layoutKind: options.layoutKind,
    title,
    parts,
    look: resolveBrandLook({
      brandId: options.brandId,
      prompt,
      palette: options.brandPalette,
    }),
    fieldValues: options.fieldValues,
  });
  return html ? injectBrandMedia(html, options.brandMedia) : null;
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
  <title>${escapeHtml(script.title || 'LYON Studio Video')}</title>
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
    <strong>LYON Studio</strong> · ${escapeHtml(script.title || 'Chưa đặt tên')}
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

    return {
      finalOutputPath: drive.webViewLink,
      absoluteFinalPath: absolutePath,
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
    layoutId,
    brandId,
    preferredMotion,
    publishTarget = 'local',
    fieldValues = {},
    parts: rawParts,
    brandMedia,
  } = options;

  const parts = parseParts(rawParts);
  const aspect = fieldValues.aspect ? `Tỷ lệ khung hình: ${fieldValues.aspect}` : '';
  const resolution = fieldValues.resolution
    ? `Độ phân giải: ${fieldValues.resolution}`
    : '';
  const durationHint = durationHintFromFields(fieldValues);
  const effectivePrompt = [prompt?.trim(), aspect, resolution]
    .filter(Boolean)
    .join('\n');

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
            durationHint
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
    const sceneParts = script.scenes.map((scene, index) => ({
      id: `scene-${index + 1}`,
      role: 'body' as const,
      title: scene.visualText,
      body: scene.voiceoverText,
    }));
    const layoutHtml = htmlForChosenLayout(
      options,
      script.title || fieldValues.title || 'LYON Studio',
      sceneParts,
      effectivePrompt
    );
    const designedHtml =
      layoutHtml ||
      (await fillHtmlVideoTemplate({
      templateId,
      layoutId,
      title: script.title || fieldValues.title || 'LYON Studio',
      parts: sceneParts,
      brandId,
      prompt: effectivePrompt,
      palette: options.brandPalette,
      preferredMotion,
      scenes: script.scenes.map((scene) => ({
        title: scene.visualText,
        body: scene.voiceoverText,
        duration: scene.duration,
      })),
      media: brandMedia,
    }));
    await fs.writeFile(
      indexHtmlPath,
      designedHtml ||
        injectBrandMedia(
          buildBaseHtml(script, effectivePrompt, templateId, brandId),
          brandMedia
        ),
      'utf-8'
    );

    const finalMp4 = path.join(workspacePath, 'final.mp4');
    const previewHtml = path.join(workspacePath, 'preview.html');
    await fs.copyFile(indexHtmlPath, previewHtml);

    const posters: string[] = [];
    const size = parseVideoSize(effectivePrompt);
    const totalSeconds = script.scenes.reduce(
      (sum, scene) => sum + clampSceneDuration(scene.duration || 5),
      0
    );
    const chromeMaxSec = 20;
    let recorded = false;
    if (designedHtml && hasChromeCapture() && totalSeconds <= chromeMaxSec) {
      try {
        const recordSec = Math.min(
          chromeMaxSec,
          Math.max(6, totalSeconds || 8)
        );
        const recordedPath = path.join(workspacePath, 'recorded.mp4');
        await recordHtmlToMp4({
          htmlPath: indexHtmlPath,
          outputPath: recordedPath,
          width: size.w,
          height: size.h,
          seconds: recordSec,
        });
        await assembleVideoClips({
          clipPaths: [recordedPath],
          outputPath: finalMp4,
          totalSeconds: recordSec,
        });
        recorded = true;
        cliLogs['html-video'] = {
          stdout: 'Đã quay trang html-video (blob, chữ chạy, recipe motion).',
          stderr: '',
          command: 'chrome CDP + ffmpeg',
          ok: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        cliLogs['html-video-record'] = {
          stdout: '',
          stderr: message,
          command: 'chrome CDP record',
          ok: false,
          error: message,
        };
        for (const [index, scene] of script.scenes.entries()) {
          const sceneHtml = await fillHtmlVideoTemplate({
            templateId,
            layoutId,
            title: scene.visualText || script.title || 'LYON Studio',
            parts: [
              {
                id: `scene-${index + 1}`,
                role: 'body',
                title: scene.visualText,
                body: scene.voiceoverText,
              },
            ],
            brandId,
            prompt: effectivePrompt,
            preferredMotion,
            media: brandMedia,
          });
          if (!sceneHtml) continue;
          const htmlName = `scene-${index + 1}.html`;
          const pngName = `scene-${index + 1}.png`;
          const htmlPath = path.join(workspacePath, htmlName);
          const pngPath = path.join(workspacePath, pngName);
          await fs.writeFile(htmlPath, sceneHtml, 'utf-8');
          try {
            await screenshotHtml({
              htmlPath,
              outputPath: pngPath,
              width: size.w,
              height: size.h,
            });
            posters.push(pngPath);
          } catch (shotErr) {
            const shotMessage =
              shotErr instanceof Error ? shotErr.message : String(shotErr);
            cliLogs[`html-video-frame-${index + 1}`] = {
              stdout: '',
              stderr: shotMessage,
              command: 'chrome --screenshot html-video',
              ok: false,
              error: shotMessage,
            };
          }
        }
      }
    }

    let absoluteArtifact = finalMp4;
    let finalName = 'final.mp4';
    let degraded = false;

    if (!recorded) {
      try {
        await renderLocalMp4({
          script,
          outputPath: finalMp4,
          audioDir,
          prompt: effectivePrompt,
          brandId,
          preferredMotion,
          backgroundImages: posters,
        });
        cliLogs['local-mp4'] = {
          stdout:
            'Đã render MP4 chữ động (màu thương hiệu, chuyển động, nhạc nền).',
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
    }

    if (!(await fileExists(finalMp4))) {
      await fs.copyFile(indexHtmlPath, previewHtml);
      absoluteArtifact = previewHtml;
      finalName = 'preview.html';
      degraded = true;
    }

    await cleanupIntermediates(
      workspacePath,
      new Set([finalName, 'script.json', 'project.json', 'preview.html'])
    );

    const published = await publishArtifact(
      absoluteArtifact,
      toPublicWorkspacePath(workspacePath, finalName),
      publishTarget
    );

    keepWorkspace = true;

    await saveProjectMeta(workspacePath, {
      title: script.title || fieldValues.title || effectivePrompt.slice(0, 80) || 'Video LYON Studio',
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
  const {
    prompt,
    type,
    templateId,
    layoutId,
    brandId,
    preferredMotion,
    templateType,
    fieldValues = {},
    parts: rawParts,
    brandPalette,
    brandMedia,
  } = options;
  if (!prompt?.trim() && parseParts(rawParts).length === 0) {
    throw new Error('runPreviewPipeline: prompt is required.');
  }

  const workspacePath = path.resolve(await workspaceService.createWorkspace());
  let keepWorkspace = false;

  try {
    const previewParts = parseParts(rawParts);
    let script =
      previewParts.length > 0
        ? partsToVideoScript(
            fieldValues.title || '',
            previewParts,
            durationHintFromFields(fieldValues)
          )
        : await resolveVideoScript(
            prompt?.trim() || '',
            type,
            enrichPrompt(prompt?.trim() || '', templateId, brandId, preferredMotion)
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
    const socialPreview =
      exportKindForType(templateType, fieldValues) === 'image';
    const previewTitle = fieldValues.title || script.title || 'LYON Studio';
    const previewBodyParts = previewParts.length
      ? previewParts
      : script.scenes.map((scene, index) => ({
          id: `scene-${index + 1}`,
          role: 'body' as const,
          title: scene.visualText,
          body: scene.voiceoverText,
        }));
    const videoPreview = await fillHtmlVideoTemplate({
      templateId,
      layoutId,
      title: previewTitle,
      parts: previewBodyParts,
      brandId,
      prompt,
      palette: brandPalette,
      preferredMotion,
      scenes: script.scenes.map((scene) => ({
        title: scene.visualText,
        body: scene.voiceoverText,
        duration: scene.duration,
      })),
      media: brandMedia,
    });
    const skillPreview = await fillStudioSkillHtml({
      templateId,
      layoutId,
      title: previewTitle,
      parts: previewBodyParts,
      brandId,
      prompt,
      palette: brandPalette,
      media: brandMedia,
      fieldValues,
    });
    const chosenLayoutHtml = htmlForChosenLayout(
      options,
      previewTitle,
      previewBodyParts,
      prompt
    );
    await fs.writeFile(
      indexHtmlPath,
      chosenLayoutHtml ||
      videoPreview ||
      skillPreview ||
      (socialPreview
        ? injectBrandMedia(
            buildSocialGraphicHtml({
              title: previewTitle,
              parts: previewParts.length
                ? previewParts
                : script.scenes.map((scene, index) => ({
                    id: `scene-${index + 1}`,
                    role: 'body',
                    title: scene.visualText,
                    body: scene.voiceoverText,
                  })),
              prompt,
              brandId,
              palette: brandPalette,
              cta: fieldValues.cta,
              aspect: fieldValues.aspect,
            }),
            brandMedia
          )
        : injectBrandMedia(
            buildBrandedHtml({
              title: fieldValues.title || script.title || 'LYON Studio',
              parts: previewParts,
              script,
              prompt,
              brandId,
              palette: brandPalette,
              templateType,
              mode:
                templateType === 'document' ||
                templateType === 'newsletter' ||
                templateType === 'resume' ||
                templateType === 'brochure' ||
                templateType === 'worksheet' ||
                templateType === 'quiz'
                  ? 'print'
                  : templateType === 'poster' ||
                      templateType === 'event' ||
                      templateType === 'infographic' ||
                      templateType === 'landing' ||
                      templateType === 'certificate'
                    ? 'poster'
                    : 'slides',
              fieldValues,
            }),
            brandMedia
          )),
      'utf-8'
    );

    const layoutHtmlPath = path.join(workspacePath, 'layout.html');
    if (!chosenLayoutHtml && !socialPreview && !skillPreview && !videoPreview) {
      try {
        await runHtmlAnything(indexHtmlPath, layoutHtmlPath, workspacePath);
      } catch {
        // Soft-fail — preview still works from index.html
      }
    }

    const motionHtml = path.join(workspacePath, 'motion.html');
    const motionInput = (await fileExists(layoutHtmlPath))
      ? layoutHtmlPath
      : indexHtmlPath;
    if (!chosenLayoutHtml && !socialPreview && !skillPreview && !videoPreview) {
      try {
        await runMotionAnything(motionInput, motionHtml, workspacePath);
      } catch {
        // Soft-fail
      }
    }

    const previewName = 'preview.html';
    const previewAbs = path.join(workspacePath, previewName);
    const best = chosenLayoutHtml
      ? indexHtmlPath
      : (await fileExists(motionHtml))
        ? motionHtml
        : (await fileExists(layoutHtmlPath))
          ? layoutHtmlPath
          : indexHtmlPath;
    await fs.copyFile(best, previewAbs);

    keepWorkspace = true;

    const previewUrl = toPublicWorkspacePath(workspacePath, previewName);
    await saveProjectMeta(workspacePath, {
      title: script.title || (prompt ?? '').slice(0, 80) || 'Xem trước LYON Studio',
      type,
      kind: 'preview',
      templateId,
      brandId,
      promptSnippet: (prompt ?? '').slice(0, 200),
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
    layoutId,
    brandId,
    preferredMotion,
    publishTarget = 'local',
    templateType,
    fieldValues = {},
    parts: rawParts,
    brandPalette,
    brandMedia,
  } = options;

  const kind = exportKindForType(templateType, fieldValues);
  if (kind === 'video' || (!templateType && type === 'video')) {
    return runVideoPipeline(options);
  }
  if (kind === 'image') {
    return runImagePipeline(options);
  }

  const parts = parseParts(rawParts);
  const workspacePath = path.resolve(await workspaceService.createWorkspace());
  const cliLogs: PipelineResult['cliLogs'] = {};
  let keepWorkspace = false;

  try {
    let script =
      parts.length > 0
        ? partsToVideoScript(
            fieldValues.title || '',
            parts,
            durationHintFromFields(fieldValues)
          )
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

    const title = fieldValues.title || script.title || 'LYON Studio';
    const htmlName = type === 'poster' ? 'poster.html' : 'slides.html';
    const htmlPath = path.join(workspacePath, htmlName);
    const bodyParts = parts.length
      ? parts
      : script.scenes.map((scene, index) => ({
          id: `scene-${index + 1}`,
          role: 'body' as const,
          title: scene.visualText,
          body: scene.voiceoverText,
        }));
    const chosenLayoutHtml = htmlForChosenLayout(
      options,
      title,
      bodyParts,
      prompt
    );
    const skillHtml = await fillStudioSkillHtml({
      templateId,
      layoutId,
      title,
      parts: bodyParts,
      brandId,
      prompt,
      palette: brandPalette,
      media: brandMedia,
      fieldValues,
    });
    await fs.writeFile(
      htmlPath,
      chosenLayoutHtml ||
      skillHtml ||
        injectBrandMedia(
          buildBrandedHtml({
            title,
            parts,
            script,
            prompt,
            brandId,
            palette: brandPalette,
            templateType,
            mode: kind === 'pdf' ? 'print' : type === 'poster' ? 'poster' : 'slides',
            fieldValues,
          }),
          brandMedia
        ),
      'utf-8'
    );

    let artifactPath = htmlPath;
    let fileName = htmlName;
    if (kind === 'pdf') {
      fileName = 'document.pdf';
      artifactPath = path.join(workspacePath, fileName);
      let printed = false;
      if ((chosenLayoutHtml || skillHtml) && hasChromeCapture()) {
        try {
          await printHtmlToPdf({ htmlPath, outputPath: artifactPath });
          printed = true;
          cliLogs['skill-pdf'] = {
            stdout: 'PDF in từ HTML skill html-anything (Chrome).',
            stderr: '',
            command: 'chrome --print-to-pdf',
            ok: true,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          cliLogs['skill-pdf'] = {
            stdout: '',
            stderr: message,
            command: 'chrome --print-to-pdf',
            ok: false,
            error: message,
          };
        }
      }
      if (!printed) {
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
          palette: brandPalette,
          prompt,
          paper: fieldValues.paper || fieldValues.size,
        });
      }
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
      cliLogs,
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

async function runImagePipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const {
    prompt = '',
    type,
    templateId,
    layoutId,
    brandId,
    preferredMotion,
    publishTarget = 'local',
    fieldValues = {},
    parts: rawParts,
    brandPalette,
    brandMedia,
  } = options;

  const parts = parseParts(rawParts);
  const workspacePath = path.resolve(await workspaceService.createWorkspace());
  let keepWorkspace = false;

  try {
    const script =
      parts.length > 0
        ? partsToVideoScript(
            fieldValues.title || '',
            parts,
            durationHintFromFields(fieldValues)
          )
        : await resolveVideoScript(
            prompt.trim(),
            type,
            enrichPrompt(prompt.trim(), templateId, brandId, preferredMotion)
          );
    await workspaceService.writeFile(workspacePath, 'script.json', {
      ...script,
      templateId,
      brandId,
      fieldValues,
      parts,
    });

    const title = fieldValues.title || script.title || 'LYON Studio';
    const previewHtml = path.join(workspacePath, 'bai-dang.html');
    const imageParts = parts.length
      ? parts
      : script.scenes.map((scene, index) => ({
          id: `scene-${index + 1}`,
          role: 'body' as const,
          title: scene.visualText,
          body: scene.voiceoverText,
        }));
    const chosenLayoutHtml = htmlForChosenLayout(
      options,
      title,
      imageParts,
      prompt
    );
    const skillHtml = await fillStudioSkillHtml({
      templateId,
      layoutId,
      title,
      parts: imageParts,
      brandId,
      prompt,
      palette: brandPalette,
      media: brandMedia,
      fieldValues,
    });
    await fs.writeFile(
      previewHtml,
      chosenLayoutHtml ||
      skillHtml ||
        injectBrandMedia(
          buildSocialGraphicHtml({
            title,
            parts: imageParts,
            prompt,
            brandId,
            palette: brandPalette,
            cta: fieldValues.cta,
            aspect: fieldValues.aspect,
          }),
          brandMedia
        ),
      'utf-8'
    );

    let artifactPath = previewHtml;
    let fileName = 'bai-dang.html';
    const size = parseSocialSize(fieldValues);
    const capture = resolveSkillBind(templateId, layoutId)?.capture;
    if (chosenLayoutHtml && hasChromeCapture()) {
      try {
        const pngName = 'bai-dang.png';
        const pngPath = path.join(workspacePath, pngName);
        await screenshotHtml({
          htmlPath: previewHtml,
          outputPath: pngPath,
          width: size.w,
          height: size.h,
        });
        artifactPath = pngPath;
        fileName = pngName;
      } catch (err) {
        console.error('[pipeline] Chrome PNG layout failed:', err);
      }
    } else if (skillHtml && hasChromeCapture() && capture === 'all-cards') {
      const total = countSkillCards(skillHtml);
      const pngs: string[] = [];
      for (let i = 1; i <= total; i += 1) {
        const cardHtml = isolateSkillCard(skillHtml, i);
        const cardPath = path.join(workspacePath, `khung-${i}.html`);
        const pngPath = path.join(workspacePath, `khung-${i}.png`);
        await fs.writeFile(cardPath, cardHtml, 'utf-8');
        try {
          await screenshotHtml({
            htmlPath: cardPath,
            outputPath: pngPath,
            width: size.w,
            height: size.h,
          });
          pngs.push(pngPath);
        } catch (err) {
          console.error(`[pipeline] Chrome card ${i} failed:`, err);
        }
      }
      if (pngs.length === 1) {
        artifactPath = pngs[0];
        fileName = path.basename(pngs[0]);
      } else if (pngs.length > 1) {
        const zipPath = path.join(workspacePath, 'carousel-anh.zip');
        if (await zipFiles(pngs, zipPath)) {
          artifactPath = zipPath;
          fileName = 'carousel-anh.zip';
        } else {
          artifactPath = pngs[0];
          fileName = path.basename(pngs[0]);
        }
      }
    } else if (skillHtml && hasChromeCapture()) {
      try {
        const pngName = 'bai-dang.png';
        const pngPath = path.join(workspacePath, pngName);
        await screenshotHtml({
          htmlPath: previewHtml,
          outputPath: pngPath,
          width: size.w,
          height: size.h,
        });
        artifactPath = pngPath;
        fileName = pngName;
      } catch (err) {
        console.error('[pipeline] Chrome PNG skill failed:', err);
      }
    }
    if (fileName === 'bai-dang.html' && !chosenLayoutHtml) {
      try {
        const rendered = await renderSocialPngs({
          title,
          parts: imageParts,
          fieldValues,
          brandId,
          prompt,
          palette: brandPalette,
          outputDir: workspacePath,
        });
        artifactPath = rendered.artifactPath;
        fileName = rendered.fileName;
      } catch (err) {
        console.error('[pipeline] PNG social failed, falling back to HTML:', err);
      }
    }

    const published = await publishArtifact(
      artifactPath,
      toPublicWorkspacePath(workspacePath, fileName),
      publishTarget
    );

    keepWorkspace = true;

    await saveProjectMeta(workspacePath, {
      title,
      type: 'poster',
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
        console.error('[pipeline] image workspace cleanup failed:', cleanupErr);
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
