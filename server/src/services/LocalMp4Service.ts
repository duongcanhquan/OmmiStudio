import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { bareHex, resolveBrandLook } from './brandLook';
import { toScreenCopy } from './kineticCopy';
import type { VideoScript } from './LLMService';

const FONT_CANDIDATES = [
  '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  '/Library/Fonts/Arial Unicode.ttf',
  'C:\\Windows\\Fonts\\arialbd.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
];

function commandExists(bin: string): boolean {
  const probe =
    process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`;
  return spawnSync(probe, { shell: true, stdio: 'ignore' }).status === 0;
}

export function resolveFfmpegPath(): string | null {
  if (commandExists('ffmpeg')) return 'ffmpeg';
  const candidates = [
    path.resolve(__dirname, '../../bin/ffmpeg'),
    path.resolve(__dirname, '../../node_modules/ffmpeg-static/ffmpeg'),
    path.resolve(__dirname, '../../../node_modules/ffmpeg-static/ffmpeg'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
    if (fs.existsSync(`${candidate}.exe`)) return `${candidate}.exe`;
  }
  return null;
}

function resolveFontPath(): string {
  for (const candidate of FONT_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'Không tìm thấy font chữ để render tiếng Việt. Cần Arial Unicode hoặc tương đương.'
  );
}

function parseAspect(prompt: string): { w: number; h: number } {
  const match = prompt.match(/Tỷ lệ khung hình:\s*([0-9]+):([0-9]+)/i);
  const w = Number(match?.[1]);
  const h = Number(match?.[2]);
  if (w === 9 && h === 16) return { w: 1080, h: 1920 };
  if (w === 1 && h === 1) return { w: 1080, h: 1080 };
  if (w === 4 && h === 5) return { w: 1080, h: 1350 };
  if (w === 21 && h === 9) return { w: 1920, h: 822 };
  return { w: 1920, h: 1080 };
}

function resolveLook(brandId?: string, prompt?: string) {
  const look = resolveBrandLook({ brandId, prompt });
  return {
    name: look.name,
    bg: bareHex(look.bg),
    text: bareHex(look.text),
    accent: bareHex(look.accent),
    secondary: bareHex(look.primary),
  };
}

function wrapVisual(text: string, maxChars: number): string {
  const words = toScreenCopy(text)
    .split(' ')
    .filter(Boolean);
  if (words.length === 0) return 'LYON Studio';
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
  return lines.slice(0, 3).join('\n');
}

function escapeFilterPath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/'/g, "'\\''");
}

/** Commas split FFmpeg filtergraphs — escape them inside expressions. */
function expr(value: string): string {
  return value.replace(/,/g, '\\,');
}

function motionExpr(
  motion: string,
  baseY: string,
  baseSize: number,
  duration: number
): {
  x: string;
  y: string;
  fontsize: string;
  alpha: string;
} {
  const hold = Math.max(duration - 0.45, 0.8).toFixed(2);
  const alpha = expr(
    `if(lt(t,0.55),t/0.55,if(lt(t,${hold}),1,max(0,(${duration}-t)/0.45)))`
  );
  const key = motion.toLowerCase();
  if (
    key.includes('slide') ||
    key.includes('backin') ||
    key.includes('rise') ||
    /(^|[-_])(up|down|left|right)([-_]|$)/.test(key)
  ) {
    return {
      x: '(w-text_w)/2',
      y: expr(`${baseY}+80*max(0,1-t/0.65)`),
      fontsize: String(baseSize),
      alpha,
    };
  }
  if (
    key.includes('zoom') ||
    key.includes('ken') ||
    key.includes('bounce') ||
    key.includes('flip') ||
    key.includes('scale')
  ) {
    return {
      x: '(w-text_w)/2',
      y: baseY,
      fontsize: expr(`${baseSize}+10*min(1,t/0.7)`),
      alpha,
    };
  }
  if (key.includes('glitch') || key.includes('shake')) {
    return {
      x: expr('(w-text_w)/2+if(lt(t,0.35),8*sin(40*t),0)'),
      y: baseY,
      fontsize: String(baseSize),
      alpha,
    };
  }
  return {
    x: '(w-text_w)/2',
    y: baseY,
    fontsize: String(baseSize),
    alpha,
  };
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

async function renderSceneClip(input: {
  ffmpeg: string;
  font: string;
  brand: string;
  text: string;
  motion: string;
  duration: number;
  size: { w: number; h: number };
  look: ReturnType<typeof resolveLook>;
  outputPath: string;
  workDir: string;
  sceneId: number;
  index: number;
  total: number;
}): Promise<void> {
  const duration = Math.max(4, Math.min(8, input.duration || 5));
  const maxChars = input.size.w >= input.size.h ? 16 : 11;
  const textFile = path.join(input.workDir, `scene_${input.sceneId}.txt`);
  const brandFile = path.join(input.workDir, `brand_${input.sceneId}.txt`);
  await fsPromises.writeFile(textFile, wrapVisual(input.text, maxChars), 'utf-8');
  await fsPromises.writeFile(brandFile, input.brand.slice(0, 32), 'utf-8');

  const fontSize = input.size.w >= 1600 ? 68 : input.size.w >= 1000 ? 52 : 40;
  const motion = motionExpr(input.motion, '(h-text_h)/2', fontSize, duration);
  const barW = `iw*min(1\\,0.18+0.82*t/${Math.max(duration - 0.4, 1)})`;

  const vf = [
    `drawbox=x=0:y=0:w=iw:h=ih:color=0x${input.look.bg}:t=fill`,
    `drawbox=x=0:y=0:w=iw:h=ih*0.22:color=0x${input.look.secondary}@0.18:t=fill`,
    `drawbox=x=64:y=ih-28:w=${barW}:h=8:color=0x${input.look.accent}:t=fill`,
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `textfile='${escapeFilterPath(brandFile)}'`,
      'fontsize=28',
      `fontcolor=0x${input.look.secondary}`,
      'x=64',
      'y=56',
      `alpha='${expr('min(1,t/0.4)')}'`,
    ].join(':'),
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `textfile='${escapeFilterPath(textFile)}'`,
      `fontsize=${motion.fontsize}`,
      `fontcolor=0x${input.look.text}`,
      'line_spacing=20',
      `x=${motion.x}`,
      `y=${motion.y}`,
      `alpha='${motion.alpha}'`,
    ].join(':'),
    [
      `drawtext=fontfile='${escapeFilterPath(input.font)}'`,
      `text='${input.index + 1} / ${input.total}'`,
      'fontsize=22',
      `fontcolor=0x${input.look.secondary}`,
      'x=w-160',
      'y=56',
      "alpha='0.7'",
    ].join(':'),
  ].join(',');

  await runFfmpeg(input.ffmpeg, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x${input.look.bg}:s=${input.size.w}x${input.size.h}:d=${duration}:r=30`,
    '-vf',
    vf,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    input.outputPath,
  ]);
}

async function mixMusicBed(
  ffmpeg: string,
  videoPath: string,
  outputPath: string,
  seconds: number
): Promise<void> {
  const bed = path.join(path.dirname(outputPath), 'mp4-work', 'bed.m4a');
  await runFfmpeg(ffmpeg, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `aevalsrc=0.06*sin(2*PI*196*t)+0.045*sin(2*PI*247*t)+0.035*sin(2*PI*294*t)+0.02*sin(2*PI*392*t):s=44100:d=${seconds}`,
    '-af',
    `lowpass=f=820,afade=t=in:st=0:d=1.1,afade=t=out:st=${Math.max(seconds - 1.4, 0.5)}:d=1.3`,
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    bed,
  ]);

  await runFfmpeg(ffmpeg, [
    '-y',
    '-i',
    videoPath,
    '-i',
    bed,
    '-filter_complex',
    '[1:a]volume=0.22[a]',
    '-map',
    '0:v',
    '-map',
    '[a]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    '-movflags',
    '+faststart',
    outputPath,
  ]);
}

export async function renderLocalMp4(input: {
  script: VideoScript;
  outputPath: string;
  audioDir?: string;
  prompt?: string;
  brandId?: string;
  preferredMotion?: string;
}): Promise<string> {
  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) {
    throw new Error(
      'Chưa có FFmpeg. Cài ffmpeg-static (pnpm install) hoặc cài FFmpeg trên máy.'
    );
  }

  const font = resolveFontPath();
  const size = parseAspect(input.prompt ?? '');
  const look = resolveLook(input.brandId, input.prompt);
  const outputPath = path.resolve(input.outputPath);
  const workDir = path.join(path.dirname(outputPath), 'mp4-work');
  await fsPromises.mkdir(workDir, { recursive: true });

  const scenes = input.script.scenes.length
    ? input.script.scenes
    : [
        {
          sceneId: 1,
          visualText: input.script.title || look.name,
          voiceoverText: '',
          motionType: 'fade-in',
          duration: 5,
        },
      ];

  const clips: string[] = [];
  for (const [index, scene] of scenes.entries()) {
    const clipPath = path.join(workDir, `scene_${scene.sceneId}.mp4`);
    await renderSceneClip({
      ffmpeg,
      font,
      brand: look.name,
      text: scene.visualText || scene.voiceoverText || input.script.title || '',
      motion: input.preferredMotion || scene.motionType || 'fade-in',
      duration: scene.duration,
      size,
      look,
      outputPath: clipPath,
      workDir,
      sceneId: scene.sceneId,
      index,
      total: scenes.length,
    });
    clips.push(clipPath);
  }

  const listPath = path.join(workDir, 'concat.txt');
  await fsPromises.writeFile(
    listPath,
    clips.map((clip) => `file '${clip.replace(/'/g, "'\\''")}'`).join('\n'),
    'utf-8'
  );

  const silentPath = path.join(workDir, 'silent.mp4');
  await runFfmpeg(ffmpeg, [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-c',
    'copy',
    silentPath,
  ]);

  const totalSeconds = scenes.reduce(
    (sum, scene) => sum + Math.max(4, Math.min(8, scene.duration || 5)),
    0
  );
  try {
    await mixMusicBed(ffmpeg, silentPath, outputPath, totalSeconds);
  } catch {
    await fsPromises.copyFile(silentPath, outputPath);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error('FFmpeg không tạo được file MP4.');
  }
  return outputPath;
}
