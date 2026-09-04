#!/usr/bin/env node
/**
 * LYON Studio — master setup script
 *
 * 1. Checks system deps (ffmpeg, python/pip)
 * 2. Clones nexu-io + vox-director under /server/tools (assets, không build Electron)
 * 3. Installs edge-tts into a local Python venv for Vietnamese voiceovers
 *
 * Usage:
 *   pnpm --filter @omnistudio/server setup
 *   node server/scripts/setup-all.js
 *
 * Recommended first (from /server):
 *   pnpm add express cors dotenv shelljs
 *   pnpm add -D @types/cors @types/express @types/shelljs
 */

const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SERVER_ROOT = path.resolve(__dirname, '..');
const TOOLS_DIR = path.join(SERVER_ROOT, 'tools');
const VENV_DIR = path.join(SERVER_ROOT, '.venv');

const REPOS = [
  {
    name: 'html-anything',
    url: 'https://github.com/nexu-io/html-anything.git',
    postInstall: [],
  },
  {
    name: 'motion-anything',
    url: 'https://github.com/nexu-io/motion-anything.git',
    postInstall: [],
  },
  {
    name: 'html-video',
    url: 'https://github.com/nexu-io/html-video.git',
    postInstall: [],
  },
  {
    name: 'open-design',
    url: 'https://github.com/nexu-io/open-design.git',
    sparse: ['design-systems', 'design-templates'],
    postInstall: [],
  },
  {
    name: 'nexu',
    url: 'https://github.com/nexu-io/nexu.git',
    sparse: ['nexu-skills', 'skills'],
    postInstall: [],
  },
  {
    name: 'vox-director',
    url: 'https://github.com/Alisa0808/vox-director.git',
    postInstall: [],
  },
  {
    name: 'deep-research',
    url: 'https://github.com/dzhng/deep-research.git',
    postInstall: [],
  },
];

const IS_WIN = process.platform === 'win32';

function banner(title) {
  const line = '═'.repeat(66);
  console.log(`\n╔${line}╗`);
  console.log(`║  ${title.padEnd(64)}║`);
  console.log(`╚${line}╝\n`);
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

function ok(msg) {
  console.log(`  ✅  ${msg}`);
}

function warn(msg) {
  console.warn(`  ⚠️  ${msg}`);
}

function fail(msg) {
  console.error(`  ❌  ${msg}`);
}

function info(msg) {
  console.log(`  →  ${msg}`);
}

function which(bin) {
  const result = shell.which(bin);
  return result ? String(result) : null;
}

function run(command, cwd = SERVER_ROOT, { allowFail = false, silent = false } = {}) {
  info(`$ ${command}${cwd !== SERVER_ROOT ? `  (cwd: ${path.basename(cwd)})` : ''}`);
  const result = spawnSync(command, {
    cwd,
    shell: true,
    stdio: silent ? 'pipe' : 'inherit',
    env: process.env,
    encoding: 'utf8',
  });
  if (result.status !== 0 && !allowFail) {
    throw new Error(`Command failed (exit ${result.status}): ${command}`);
  }
  return result;
}

function detectPython() {
  const candidates = IS_WIN
    ? ['py -3', 'python', 'python3']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    const probe = spawnSync(`${cmd} --version`, {
      shell: true,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (probe.status === 0) {
      const version = (probe.stdout || probe.stderr || '').trim();
      return { cmd, version };
    }
  }
  return null;
}

function detectPip(pythonCmd) {
  const probes = [
    `${pythonCmd} -m pip --version`,
    'pip3 --version',
    'pip --version',
  ];
  for (const probe of probes) {
    const result = spawnSync(probe, {
      shell: true,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    if (result.status === 0) {
      return {
        cmd: probe.replace(' --version', ''),
        version: (result.stdout || '').trim(),
      };
    }
  }
  return null;
}

function detectPackageManager() {
  if (which('pnpm')) return 'pnpm';
  if (which('npm')) return 'npm';
  throw new Error('Neither pnpm nor npm found on PATH.');
}

/* ─────────────────────────────────────────────────────────────
 * Task 1.1 — System dependency checks
 * ───────────────────────────────────────────────────────────── */

function checkSystemDependencies() {
  section('1/3  System dependency check');
  const report = {
    ffmpeg: false,
    python: false,
    pip: false,
    git: false,
    node: false,
  };

  // Node
  const nodePath = which('node');
  if (nodePath) {
    ok(`Node.js found: ${shell.exec('node --version', { silent: true }).stdout.trim()} (${nodePath})`);
    report.node = true;
  } else {
    fail('Node.js not found. Install Node 20+ from https://nodejs.org');
  }

  // git
  const gitPath = which('git');
  if (gitPath) {
    ok(`git found: ${gitPath}`);
    report.git = true;
  } else {
    fail('git not found. Install Git before cloning nexu-io repos.');
  }

  // ffmpeg
  const ffmpegPath = which('ffmpeg');
  if (ffmpegPath) {
    const ver = shell.exec('ffmpeg -version', { silent: true }).stdout.split('\n')[0];
    ok(`ffmpeg found: ${ver}`);
    report.ffmpeg = true;
  } else {
    console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║  WARNING: ffmpeg is NOT installed                              ║
  ║  Required by html-video for local MP4 encoding (libx264).      ║
  ║                                                                ║
  ║  Windows:  winget install Gyan.FFmpeg                          ║
  ║            OR  choco install ffmpeg                            ║
  ║  macOS:    brew install ffmpeg                                 ║
  ║  Linux:    sudo apt install ffmpeg                             ║
  ║                                                                ║
  ║  After install, reopen the terminal and re-run this script.    ║
  ║  Verify with:  ffmpeg -version                                 ║
  ╚════════════════════════════════════════════════════════════════╝
`);
  }

  // python + pip (for edge-tts)
  const python = detectPython();
  if (python) {
    ok(`Python found: ${python.version} via \`${python.cmd}\``);
    report.python = true;

    const pip = detectPip(python.cmd);
    if (pip) {
      ok(`pip found: ${pip.version || pip.cmd}`);
      report.pip = true;
    } else {
      warn('pip not found. Install with: python -m ensurepip --upgrade');
      warn('Vietnamese TTS (edge-tts) cannot be installed without pip.');
    }
  } else {
    console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║  WARNING: Python is NOT installed                              ║
  ║  Required for edge-tts Vietnamese voiceovers.                  ║
  ║                                                                ║
  ║  Windows:  winget install Python.Python.3.12                   ║
  ║  macOS:    brew install python                                 ║
  ║  Linux:    sudo apt install python3 python3-pip python3-venv   ║
  ║                                                                ║
  ║  Verify:  python --version   AND   python -m pip --version     ║
  ╚════════════════════════════════════════════════════════════════╝
`);
  }

  return { report, python };
}

/* ─────────────────────────────────────────────────────────────
 * Task 1.2 — Clone + install nexu-io tools
 * ───────────────────────────────────────────────────────────── */

function cloneAndInstallTools(pm) {
  section('2/3  Clone & install nexu-io vendor tools');

  if (!which('git')) {
    fail('Skipping clone step — git is missing.');
    return;
  }

  shell.mkdir('-p', TOOLS_DIR);
  ok(`Tools directory: ${TOOLS_DIR}`);

  for (const repo of REPOS) {
    console.log(`\n  ▸ ${repo.name}`);
    const target = path.join(TOOLS_DIR, repo.name);

    if (fs.existsSync(path.join(target, '.git'))) {
      info('already cloned — pulling latest (ff-only)');
      run('git pull --ff-only', target, { allowFail: true });
    } else if (fs.existsSync(target)) {
      warn(`${repo.name}: folder exists but is not a git repo — keeping local copy`);
    } else if (repo.sparse?.length) {
      run(
        `git clone --depth 1 --filter=blob:none --sparse ${repo.url} "${target}"`,
        TOOLS_DIR
      );
      run(
        `git sparse-checkout set ${repo.sparse.map((s) => `"${s}"`).join(' ')}`,
        target
      );
    } else {
      run(`git clone --depth 1 ${repo.url} "${target}"`, TOOLS_DIR);
    }

    info('Studio đọc asset trên đĩa — bỏ qua pnpm install monorepo.');

    for (const cmd of repo.postInstall) {
      try {
        run(cmd, target);
      } catch (err) {
        warn(`${repo.name} post-install failed: ${err.message}`);
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────────
 * Task 1.3 — edge-tts for Vietnamese voiceovers
 * ───────────────────────────────────────────────────────────── */

function installEdgeTts(python) {
  section('3/3  Install edge-tts (Vietnamese AI voiceovers)');

  if (!python) {
    fail('Python missing — skipping edge-tts. Re-run after installing Python.');
    return null;
  }

  // Prefer an isolated venv under /server/.venv
  const venvPython = IS_WIN
    ? path.join(VENV_DIR, 'Scripts', 'python.exe')
    : path.join(VENV_DIR, 'bin', 'python');
  const venvEdgeTts = IS_WIN
    ? path.join(VENV_DIR, 'Scripts', 'edge-tts.exe')
    : path.join(VENV_DIR, 'bin', 'edge-tts');

  if (!fs.existsSync(venvPython)) {
    info(`Creating local venv at ${VENV_DIR}`);
    try {
      run(`${python.cmd} -m venv "${VENV_DIR}"`, SERVER_ROOT);
    } catch (err) {
      warn(`venv creation failed (${err.message}). Falling back to user pip install.`);
      try {
        run(`${python.cmd} -m pip install --user edge-tts`, SERVER_ROOT);
        ok('edge-tts installed via pip --user');
        return { mode: 'user', binary: 'edge-tts' };
      } catch (pipErr) {
        fail(`Could not install edge-tts: ${pipErr.message}`);
        return null;
      }
    }
  } else {
    ok(`Reusing existing venv: ${VENV_DIR}`);
  }

  try {
    run(`"${venvPython}" -m pip install --upgrade pip edge-tts`, SERVER_ROOT);
  } catch (err) {
    fail(`edge-tts pip install failed: ${err.message}`);
    return null;
  }

  if (fs.existsSync(venvEdgeTts) || fs.existsSync(venvPython)) {
    ok(`edge-tts ready (venv): ${venvEdgeTts}`);
    info('Voices: vi-VN-NamMinhNeural (north) · vi-VN-HoaiMyNeural (south)');
    return { mode: 'venv', binary: venvEdgeTts, python: venvPython };
  }

  warn('edge-tts binary not found after install — VoiceService will try PATH.');
  return { mode: 'path', binary: 'edge-tts' };
}

/* ─────────────────────────────────────────────────────────────
 * Summary
 * ───────────────────────────────────────────────────────────── */

function printSummary(report, edgeTts) {
  banner('LYON Studio setup complete');
  console.log('  System:');
  console.log(`    Node        ${report.node ? 'OK' : 'MISSING'}`);
  console.log(`    git         ${report.git ? 'OK' : 'MISSING'}`);
  console.log(`    ffmpeg      ${report.ffmpeg ? 'OK' : 'MISSING — install via winget/brew (see warning above)'}`);
  console.log(`    Python/pip  ${report.python && report.pip ? 'OK' : 'MISSING — needed for TTS'}`);
  console.log(`    edge-tts    ${edgeTts ? `OK (${edgeTts.mode})` : 'NOT INSTALLED'}`);
  console.log(`\n  Vendor tools: ${TOOLS_DIR}`);
  for (const repo of REPOS) {
    const exists = fs.existsSync(path.join(TOOLS_DIR, repo.name));
    console.log(`    ${exists ? '✓' : '✗'}  ${repo.name}`);
  }
  console.log(`
  Next steps:
    1. If ffmpeg was missing → install it, then verify: ffmpeg -version
    2. For html-video Chromium:  cd server/tools/html-video && npx playwright install chromium
    3. Start the engine:         pnpm --filter @omnistudio/server dev
`);
}

function main() {
  banner('LYON Studio — Master Setup');
  console.log(`  Server root: ${SERVER_ROOT}`);

  const { report, python } = checkSystemDependencies();

  let pm = 'npm';
  try {
    pm = detectPackageManager();
    ok(`Package manager: ${pm}`);
  } catch (err) {
    fail(err.message);
    process.exit(1);
  }

  if (!report.git) {
    fail('Cannot continue without git.');
    process.exit(1);
  }

  cloneAndInstallTools(pm);
  const edgeTts = installEdgeTts(python);
  printSummary(report, edgeTts);

  // Soft-fail exit if critical TTS/ffmpeg pieces missing — still useful to have cloned tools
  if (!report.ffmpeg || !edgeTts) {
    process.exitCode = 0; // non-fatal; warnings already printed
  }
}

try {
  main();
} catch (err) {
  console.error(`\n[setup-all] FATAL: ${err.message}`);
  process.exit(1);
}
