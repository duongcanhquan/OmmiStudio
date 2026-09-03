#!/usr/bin/env node
/**
 * LYON Studio — vendor tool installer
 *
 * Clones the nexu-io CLI repositories into server/tools/ and installs
 * (and, where required, builds) their dependencies.
 *
 * Usage (from repo root or /server):
 *   node server/scripts/install-tools.js
 *   pnpm --filter @omnistudio/server install:tools
 *
 * System prerequisites you must install yourself:
 *   - git
 *   - Node.js 20+ / pnpm 9+
 *   - FFmpeg (required by html-video for MP4 encode) — see footer of this script
 *   - Playwright Chromium for html-video: npx playwright install chromium
 *   - At least one coding-agent CLI on PATH (claude, cursor-agent, codex, …)
 *     OR a BYOK API key — the nexu tools shell out to local agents
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER_ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(SERVER_ROOT, 'tools');

/** @type {{ name: string, repo: string, install: boolean, postInstall?: string[] }[]} */
const REPOS = [
  {
    name: 'open-design',
    repo: 'https://github.com/nexu-io/open-design.git',
    install: true,
    // Large monorepo — install only; CLI wiring is still evolving.
  },
  {
    name: 'html-anything',
    repo: 'https://github.com/nexu-io/html-anything.git',
    install: true,
    // Build the CLI so tools/html-anything/cli/dist/run.js exists.
    postInstall: ['pnpm -F @html-anything/cli build'],
  },
  {
    name: 'motion-anything',
    repo: 'https://github.com/nexu-io/motion-anything.git',
    // Zero npm dependencies — clone is enough; still run install if package.json exists.
    install: true,
  },
  {
    name: 'html-video',
    repo: 'https://github.com/nexu-io/html-video.git',
    install: true,
    // CLI lives at packages/cli/dist/bin.js after a full workspace build.
    postInstall: ['pnpm -r build'],
  },
];

function log(msg) {
  console.log(`[install-tools] ${msg}`);
}

function warn(msg) {
  console.warn(`[install-tools] WARN: ${msg}`);
}

function run(command, cwd, { allowFail = false } = {}) {
  log(`$ (${path.basename(cwd)}) ${command}`);
  const result = spawnSync(command, {
    cwd,
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0 && !allowFail) {
    throw new Error(`Command failed (exit ${result.status}): ${command}`);
  }
  return result.status ?? 1;
}

function hasCommand(bin) {
  const probe = process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`;
  try {
    execSync(probe, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function detectPackageManager() {
  if (hasCommand('pnpm')) return 'pnpm';
  if (hasCommand('npm')) return 'npm';
  throw new Error('Neither pnpm nor npm found on PATH. Install Node.js / pnpm first.');
}

function ensureGit() {
  if (!hasCommand('git')) {
    throw new Error('git is required. Install Git and re-run this script.');
  }
}

function cloneOrUpdate(name, repoUrl) {
  const target = path.join(TOOLS_DIR, name);

  if (fs.existsSync(path.join(target, '.git'))) {
    log(`${name}: already cloned — fetching latest (git pull --ff-only)`);
    run('git pull --ff-only', target, { allowFail: true });
    return target;
  }

  if (fs.existsSync(target)) {
    warn(`${name}: folder exists but is not a git repo — skipping clone`);
    return target;
  }

  log(`${name}: cloning ${repoUrl}`);
  run(`git clone --depth 1 ${repoUrl} "${target}"`, TOOLS_DIR);
  return target;
}

function installDeps(toolDir, pm) {
  const pkgJson = path.join(toolDir, 'package.json');
  if (!fs.existsSync(pkgJson)) {
    log(`${path.basename(toolDir)}: no package.json — skipping install`);
    return;
  }

  const cmd = pm === 'pnpm' ? 'pnpm install' : 'npm install';
  run(cmd, toolDir);
}

function main() {
  log(`Tools directory: ${TOOLS_DIR}`);
  ensureGit();
  const pm = detectPackageManager();
  log(`Using package manager: ${pm}`);

  fs.mkdirSync(TOOLS_DIR, { recursive: true });

  for (const entry of REPOS) {
    log(`── ${entry.name} ──`);
    const dir = cloneOrUpdate(entry.name, entry.repo);

    if (entry.install) {
      installDeps(dir, pm);
    }

    if (entry.postInstall?.length) {
      for (const cmd of entry.postInstall) {
        // Prefer pnpm filter commands; fall back with a warning if they fail.
        try {
          run(cmd, dir);
        } catch (err) {
          warn(`${entry.name} post-install failed: ${err.message}`);
          warn('You may need to build this tool manually before the engine can invoke it.');
        }
      }
    }
  }

  log('Done.');
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  Manual system dependencies (install these yourself)             ║
╠══════════════════════════════════════════════════════════════════╣
║  1. FFmpeg  — required by html-video (libx264 MP4 encode)        ║
║     Windows: winget install Gyan.FFmpeg                          ║
║              OR choco install ffmpeg                             ║
║     macOS:   brew install ffmpeg                                 ║
║     Linux:   sudo apt install ffmpeg                             ║
║     Verify:  ffmpeg -version                                     ║
║                                                                  ║
║  2. Playwright Chromium — html-video headless capture            ║
║     cd server/tools/html-video                                   ║
║     npx playwright install chromium                              ║
║                                                                  ║
║  3. A coding-agent CLI on PATH (or BYOK API key)                 ║
║     e.g. Claude Code, Cursor Agent, Codex, Gemini, …             ║
║     These tools shell out to local agents — they are not         ║
║     self-contained LLM runners.                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

try {
  main();
} catch (err) {
  console.error(`[install-tools] FATAL: ${err.message}`);
  process.exit(1);
}
