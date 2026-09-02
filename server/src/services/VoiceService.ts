import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { configManager } from '../config/ConfigManager';
import {
  execCommand,
  quoteShellArg,
  quoteShellString,
} from '../utils/execCommand';

export type VietnameseVoiceRegion = 'north' | 'south';

/** Microsoft Edge neural voices for Vietnamese */
export const VIETNAMESE_VOICES = {
  north: 'vi-VN-NamMinhNeural',
  south: 'vi-VN-HoaiMyNeural',
} as const;

export interface VoiceoverResult {
  outputPath: string;
  voice: string;
  region: VietnameseVoiceRegion;
  textLength: number;
}

/**
 * Resolve the edge-tts executable.
 * Prefers the local venv created by `pnpm setup` (/server/.venv), then PATH.
 */
export function resolveEdgeTtsBinary(): string {
  const serverRoot = path.resolve(__dirname, '../..');
  const isWin = process.platform === 'win32';

  const venvBinary = isWin
    ? path.join(serverRoot, '.venv', 'Scripts', 'edge-tts.exe')
    : path.join(serverRoot, '.venv', 'bin', 'edge-tts');

  if (fs.existsSync(venvBinary)) {
    return venvBinary;
  }

  return 'edge-tts';
}

/**
 * Generate a Vietnamese MP3 voiceover via the edge-tts CLI (no API key).
 *
 * @param text        Spoken script (Vietnamese supported)
 * @param outputPath  Destination `.mp3` path (parent dirs created if needed)
 * @param voiceRegion 'north' → NamMinh · 'south' → HoaiMy
 */
export async function generateVietnameseVoiceover(
  text: string,
  outputPath: string,
  voiceRegion?: VietnameseVoiceRegion
): Promise<VoiceoverResult> {
  const region: VietnameseVoiceRegion =
    voiceRegion ?? configManager.getConfig().system.defaultVoice ?? 'north';

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error(
      'generateVietnameseVoiceover: `text` must be a non-empty string.'
    );
  }
  if (!outputPath || typeof outputPath !== 'string') {
    throw new Error('generateVietnameseVoiceover: `outputPath` is required.');
  }

  const voice = VIETNAMESE_VOICES[region];
  if (!voice) {
    throw new Error(
      `Unknown voiceRegion "${region}". Use "north" or "south".`
    );
  }

  const absoluteOut = path.resolve(outputPath);
  await fsPromises.mkdir(path.dirname(absoluteOut), { recursive: true });

  const edgeTts = resolveEdgeTtsBinary();
  // edge-tts binary may be on PATH (no resolve) or an absolute venv path
  const binArg = edgeTts.includes(path.sep) || /^[A-Za-z]:\\/.test(edgeTts)
    ? quoteShellArg(edgeTts)
    : quoteShellString(edgeTts);

  // edge-tts --voice <id> --text "..." --write-media out.mp3
  const command = [
    binArg,
    '--voice',
    quoteShellString(voice),
    '--text',
    quoteShellString(text.trim()),
    '--write-media',
    quoteShellArg(absoluteOut),
  ].join(' ');

  try {
    await execCommand(command, {
      timeout: 5 * 60 * 1000,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        'edge-tts CLI failed (server will keep running).',
        message,
        'Hint: run `pnpm setup` to install edge-tts into server/.venv.',
      ].join('\n')
    );
  }

  try {
    const stat = await fsPromises.stat(absoluteOut);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`edge-tts produced an empty file at ${absoluteOut}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      [
        `Vietnamese voiceover failed — MP3 not found at ${absoluteOut}.`,
        message,
        'Hint: run `pnpm --filter @omnistudio/server setup` to install edge-tts.',
      ].join('\n')
    );
  }

  return {
    outputPath: absoluteOut,
    voice,
    region,
    textLength: text.trim().length,
  };
}

export const voiceService = {
  generateVietnameseVoiceover,
  resolveEdgeTtsBinary,
  VIETNAMESE_VOICES,
};

export default voiceService;
