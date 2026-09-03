import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  htmlAnythingCli,
  htmlVideoCli,
  motionAnythingCli,
} from '../config/nexu-tools';

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
  const htmlAnything = fs.existsSync(htmlAnythingCli);
  const motionAnything = fs.existsSync(motionAnythingCli);
  const htmlVideo = fs.existsSync(htmlVideoCli);
  const ffmpeg = commandExists('ffmpeg');
  const edgeTts = edgeTtsReady();

  return {
    htmlAnything,
    motionAnything,
    htmlVideo,
    ffmpeg,
    edgeTts,
    /** Đã có kịch bản → xuất HTML local, không cần LLM */
    llmNeededIfScriptExists: false,
    /** MP4 đầy đủ cần html-video + ffmpeg */
    mp4Ready: htmlVideo && ffmpeg,
    htmlPreviewReady: true,
  };
}
