import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  htmlAnythingCli,
  htmlVideoCli,
  motionAnythingCli,
  openDesignCli,
} from '../config/nexu-tools';
import { resolveFfmpegPath } from './LocalMp4Service';
import { probeNexuStack } from './NexuStackService';
import { hasChromeCapture } from './ChromeCaptureService';

function commandExists(bin: string): boolean {
  const probe =
    process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`;
  const result = spawnSync(probe, { shell: true, stdio: 'ignore' });
  return result.status === 0;
}

function edgeTtsReady(): boolean {
  const serverRoot = path.resolve(__dirname, '../..');
  const venvBinary =
    process.platform === 'win32'
      ? path.join(serverRoot, '.venv', 'Scripts', 'edge-tts.exe')
      : path.join(serverRoot, '.venv', 'bin', 'edge-tts');
  return fs.existsSync(venvBinary) || commandExists('edge-tts');
}

export function probeLocalRuntime() {
  const stack = probeNexuStack();
  const htmlAnything =
    fs.existsSync(htmlAnythingCli) ||
    Boolean(stack.repos.find((repo) => repo.id === 'html-anything')?.present);
  const motionAnything =
    fs.existsSync(motionAnythingCli) ||
    Boolean(stack.repos.find((repo) => repo.id === 'motion-anything')?.present);
  const htmlVideo =
    fs.existsSync(htmlVideoCli) ||
    Boolean(stack.repos.find((repo) => repo.id === 'html-video')?.present);
  const openDesign = Boolean(
    stack.repos.find((repo) => repo.id === 'open-design')?.present
  );
  const nexu = Boolean(stack.repos.find((repo) => repo.id === 'nexu')?.present);
  const ffmpeg = Boolean(resolveFfmpegPath());
  const edgeTts = edgeTtsReady();

  return {
    htmlAnything,
    motionAnything,
    htmlVideo,
    openDesign,
    nexu,
    ffmpeg,
    edgeTts,
    chrome: hasChromeCapture(),
    nexuStack: stack,
    /** Đã có kịch bản → xuất HTML local, không cần LLM */
    llmNeededIfScriptExists: false,
    /** MP4: FFmpeg + quay trang html-video (hoặc chữ động fallback) */
    mp4Ready: ffmpeg,
    htmlPreviewReady: true,
    openDesignCli: fs.existsSync(openDesignCli),
  };
}
