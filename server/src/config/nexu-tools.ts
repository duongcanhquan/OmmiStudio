import fs from 'fs';
import path from 'path';

/**
 * Absolute paths to local nexu-io vendor CLIs under /server/tools.
 *
 * Paths are resolved from this file's location so they stay correct under
 * both `tsx` (src/) and compiled `node dist/` (dist/ → still ../../tools).
 *
 * After changing tool layouts, update the relative segments below and/or
 * re-run:  pnpm --filter @omnistudio/server install:tools
 */

const TOOLS_ROOT = path.resolve(__dirname, '../../tools');

function toolPath(...segments: string[]): string {
  return path.resolve(TOOLS_ROOT, ...segments);
}

/**
 * Prefer the first path that exists on disk; otherwise return the primary
 * (documented) path so error messages still point at the expected location.
 */
function resolveExisting(candidates: string[]): string {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

/** motion-anything — single-file CLI, zero npm deps */
export const motionAnythingCli = toolPath(
  'motion-anything',
  'cli',
  'bin',
  'motion.js'
);

/**
 * html-anything — built CLI entry (`pnpm -F @html-anything/cli build`)
 * Fallback to tsx source for early hacking before a build.
 */
export const htmlAnythingCli = resolveExisting([
  toolPath('html-anything', 'cli', 'dist', 'run.js'),
  toolPath('html-anything', 'cli', 'src', 'index.ts'),
]);

/**
 * html-video — built CLI (`pnpm -r build` inside tools/html-video)
 * Invoked as: node packages/cli/dist/bin.js <subcommand>
 */
export const htmlVideoCli = toolPath(
  'html-video',
  'packages',
  'cli',
  'dist',
  'bin.js'
);

/**
 * open-design — placeholder until we pin the exact headless/CLI entry.
 * The desktop/studio app is large; adjust this once the headless API is wired.
 */
export const openDesignCli = toolPath(
  'open-design',
  'packages',
  'standalone',
  'dist',
  'cli.js'
);

export const nexuTools = {
  toolsRoot: TOOLS_ROOT,
  motionAnythingCli,
  htmlAnythingCli,
  htmlVideoCli,
  openDesignCli,
} as const;

export type NexuToolName =
  | 'html-anything'
  | 'motion-anything'
  | 'html-video'
  | 'open-design';

/** Map logical tool names → absolute Node entry scripts */
export function getCliPath(tool: NexuToolName): string {
  switch (tool) {
    case 'html-anything':
      return htmlAnythingCli;
    case 'motion-anything':
      return motionAnythingCli;
    case 'html-video':
      return htmlVideoCli;
    case 'open-design':
      return openDesignCli;
    default: {
      const _exhaustive: never = tool;
      return _exhaustive;
    }
  }
}

/**
 * Assert a CLI file exists before spawning — fails fast with a clear hint
 * to run the installer / build step.
 */
export function assertCliExists(tool: NexuToolName): string {
  const cliPath = getCliPath(tool);
  if (!fs.existsSync(cliPath)) {
    throw new Error(
      [
        `nexu-io CLI not found for "${tool}":`,
        `  ${cliPath}`,
        `Run: pnpm --filter @omnistudio/server install:tools`,
        tool === 'html-video'
          ? 'Also ensure FFmpeg is installed and `pnpm -r build` succeeded inside tools/html-video.'
          : tool === 'html-anything'
            ? 'Also ensure `pnpm -F @html-anything/cli build` succeeded inside tools/html-anything.'
            : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }
  return cliPath;
}

export default nexuTools;
