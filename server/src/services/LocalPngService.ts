import { spawn } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { resolveFfmpegPath } from './LocalMp4Service';
import {
  bareHex,
  resolveBrandLook,
  type BrandPaletteInput,
} from './brandLook';
import { toScreenCopy } from './kineticCopy';
import type { ScriptPart } from './scriptForm';

const FONT_CANDIDATES = [
  '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  '/Library/Fonts/Arial Unicode.ttf',
  'C:\\Windows\\Fonts\\arialbd.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
];

function resolveFontPath(): string {
  for (const candidate of FONT_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Không tìm thấy font chữ để render tiếng Việt. Cần Arial Unicode hoặc tương đương.'
  );
}

export function parseSocialSize(fields: Record<string, string>): {
  w: number;
  h: number;
} {
  const size = fields.size || '';
  const pixels = size.match(/^(\d+)x(\d+)$/i);
  if (pixels) return { w: Number(pixels[1]), h: Number(pixels[2]) };
  const aspect = fields.aspect || '1:1';
  if (aspect === '9:16') return { w: 1080, h: 1920 };
  if (aspect === '16:9') return { w: 1920, h: 1080 };
  if (aspect === '3:4') return { w: 1080, h: 1440 };
  if (aspect === '4:5') return { w: 1080, h: 1350 };
  return { w: 1080, h: 1080 };
}

function wrapLines(text: string, maxChars: number, maxLines: number): string {
  const words = toScreenCopy(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines).join('\n');
}

function escapeFilterPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/'/g, "'\\''");
}

function runFfmpeg(ffmpeg: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `ffmpeg thoát với mã ${code}`));
    });
  });
}

async function zipFiles(files: string[], zipPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('zip', ['-j', '-q', zipPath, ...files], {
      stdio: 'ignore',
    });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

async function renderOnePng(input: {
  ffmpeg: string;
  font: string;
  look: ReturnType<typeof resolveBrandLook>;
  size: { w: number; h: number };
  brand: string;
  headline: string;
  body: string;
  cta: string;
  index: number;
  total: number;
  workDir: string;
  outputPath: string;
}): Promise<void> {
  const maxChars = input.size.w >= input.size.h ? 18 : 12;
  const headlineFile = path.join(input.workDir, `head_${input.index}.txt`);
  const bodyFile = path.join(input.workDir, `body_${input.index}.txt`);
  const brandFile = path.join(input.workDir, `brand_${input.index}.txt`);
  const ctaFile = path.join(input.workDir, `cta_${input.index}.txt`);

  await fsPromises.writeFile(
    headlineFile,
    wrapLines(input.headline, maxChars, 3) || 'LYON Studio',
    'utf-8'
  );
  await fsPromises.writeFile(
    bodyFile,
    wrapLines(input.body, maxChars + 4, 4),
    'utf-8'
  );
  await fsPromises.writeFile(brandFile, input.brand.slice(0, 36), 'utf-8');
  await fsPromises.writeFile(ctaFile, input.cta.slice(0, 28) || 'Tìm hiểu thêm', 'utf-8');

  const primary = bareHex(input.look.primary);
  const secondary = bareHex(input.look.secondary);
  const accent = bareHex(input.look.accent);
  const surface = bareHex(input.look.surface);
  const ink = bareHex(input.look.ink);
  const muted = bareHex(input.look.muted);

  const heroH = Math.round(input.size.h * 0.46);
  const titleSize = input.size.w >= 1600 ? 56 : input.size.h > input.size.w ? 48 : 50;
  const bodySize = Math.round(titleSize * 0.4);
  const pad = 56;
  const copyY = heroH + 36;
  const ctaY = input.size.h - 92;
  const buildingW = Math.round(input.size.w * 0.18);
  const buildingH = Math.round(heroH * 0.55);

  const vf = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=0x${surface}:t=fill`,
    `drawbox=x=0:y=0:w=iw:h=${heroH}:color=0x${primary}:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.12)}:y=${heroH - buildingH}:w=${buildingW}:h=${buildingH}:color=0x${surface}@0.92:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.34)}:y=${heroH - Math.round(buildingH * 1.15)}:w=${Math.round(buildingW * 1.15)}:h=${Math.round(buildingH * 1.15)}:color=0x${surface}@0.95:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.58)}:y=${heroH - Math.round(buildingH * 0.85)}:w=${buildingW}:h=${Math.round(buildingH * 0.85)}:color=0x${surface}@0.88:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.78)}:y=48:w=90:h=90:color=0x${accent}:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.38)}:y=${heroH - Math.round(buildingH * 0.45)}:w=40:h=70:color=0x${primary}:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.16)}:y=${heroH - Math.round(buildingH * 0.62)}:w=28:h=28:color=0x${secondary}:t=fill`,
    `drawbox=x=${Math.round(input.size.w * 0.62)}:y=${heroH - Math.round(buildingH * 0.55)}:w=28:h=28:color=0x${accent}:t=fill`,
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `textfile='${escapeFilterPath(brandFile)}'`,
      'fontsize=26',
      `fontcolor=0x${accent}`,
      `x=${pad}`,
      'y=40',
    ].join(':'),
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `text='${input.index + 1}/${input.total}'`,
      'fontsize=22',
      'fontcolor=0xffffff',
      `x=${input.size.w - 110}`,
      'y=40',
    ].join(':'),
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `textfile='${escapeFilterPath(headlineFile)}'`,
      `fontsize=${titleSize}`,
      `fontcolor=0x${ink}`,
      'line_spacing=16',
      `x=${pad}`,
      `y=${copyY}`,
    ].join(':'),
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `textfile='${escapeFilterPath(bodyFile)}'`,
      `fontsize=${bodySize}`,
      `fontcolor=0x${muted}`,
      'line_spacing=12',
      `x=${pad}`,
      `y=${copyY + titleSize * 2 + 28}`,
    ].join(':'),
    `drawbox=x=${pad}:y=${ctaY}:w=380:h=56:color=0x${accent}:t=fill`,
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `textfile='${escapeFilterPath(ctaFile)}'`,
      'fontsize=24',
      `fontcolor=0x${ink}`,
      `x=${pad + 20}`,
      `y=${ctaY + 14}`,
    ].join(':'),
  ].join(',');

  await runFfmpeg(input.ffmpeg, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x${surface}:s=${input.size.w}x${input.size.h}:d=0.04`,
    '-vf',
    vf,
    '-frames:v',
    '1',
    input.outputPath,
  ]);
}

export async function renderSocialPngs(input: {
  title: string;
  parts: ScriptPart[];
  fieldValues: Record<string, string>;
  brandId?: string;
  prompt?: string;
  palette?: BrandPaletteInput | null;
  outputDir: string;
}): Promise<{ artifactPath: string; fileName: string; pngPaths: string[] }> {
  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) {
    throw new Error('Không tìm thấy FFmpeg để xuất ảnh PNG.');
  }
  const font = resolveFontPath();
  const look = resolveBrandLook({
    brandId: input.brandId,
    prompt: input.prompt,
    palette: input.palette,
  });
  const size = parseSocialSize(input.fieldValues);
  const frames =
    input.parts.length > 0
      ? input.parts
      : [
          {
            id: 'one',
            role: 'body' as const,
            title: input.title,
            body: '',
          },
        ];

  const workDir = path.join(input.outputDir, 'png-work');
  await fsPromises.mkdir(workDir, { recursive: true });

  const pngPaths: string[] = [];
  const cta =
    input.fieldValues.cta?.trim() ||
    frames.find((part) => part.role === 'cta')?.title ||
    'Tìm hiểu thêm';

  for (const [index, part] of frames.entries()) {
    const fileName =
      frames.length === 1 ? 'bai-dang.png' : `khung-${index + 1}.png`;
    const outputPath = path.join(input.outputDir, fileName);
    await renderOnePng({
      ffmpeg,
      font,
      look,
      size,
      brand: look.name,
      headline: part.title || input.title,
      body: part.body || part.notes || '',
      cta,
      index,
      total: frames.length,
      workDir,
      outputPath,
    });
    pngPaths.push(outputPath);
  }

  if (pngPaths.length === 1) {
    return {
      artifactPath: pngPaths[0],
      fileName: path.basename(pngPaths[0]),
      pngPaths,
    };
  }

  const zipName = 'carousel-anh.zip';
  const zipPath = path.join(input.outputDir, zipName);
  const zipped = await zipFiles(pngPaths, zipPath);
  if (zipped) {
    return { artifactPath: zipPath, fileName: zipName, pngPaths };
  }
  return {
    artifactPath: pngPaths[0],
    fileName: path.basename(pngPaths[0]),
    pngPaths,
  };
}
