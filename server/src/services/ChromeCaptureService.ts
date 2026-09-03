import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter((value): value is string => Boolean(value));

function resolveChromePath(): string | null {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function looksLikeOutput(filePath: string): boolean {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 64) return false;
    if (filePath.endsWith('.png')) {
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    }
    if (filePath.endsWith('.pdf')) {
      return buf.slice(0, 4).toString('ascii') === '%PDF';
    }
    return true;
  } catch {
    return false;
  }
}

function waitForValidFile(filePath: string, timeoutMs: number): Promise<void> {
  const started = Date.now();
  let lastSize = -1;
  let stableHits = 0;
  return new Promise((resolve, reject) => {
    const tick = () => {
      try {
        if (fs.existsSync(filePath)) {
          const size = fs.statSync(filePath).size;
          if (size === lastSize && size > 64) stableHits += 1;
          else {
            lastSize = size;
            stableHits = 0;
          }
          if (stableHits >= 2 && looksLikeOutput(filePath)) {
            resolve();
            return;
          }
        }
      } catch {
        // still writing
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Chrome quá hạn — không tạo được file từ HTML skill.'));
        return;
      }
      setTimeout(tick, 200);
    };
    tick();
  });
}

function runChrome(args: string[], outputPath: string): Promise<void> {
  const chrome = resolveChromePath();
  if (!chrome) {
    throw new Error(
      'Không tìm thấy Chrome/Chromium để in HTML skill ra ảnh/PDF.'
    );
  }
  try {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  } catch {
    // ignore
  }
  const userData = path.join(
    process.env.TMPDIR || '/tmp',
    `lyon-chrome-${process.pid}-${Date.now()}`
  );
  return new Promise((resolve, reject) => {
    const child = spawn(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-sync',
        '--disable-translate',
        '--disable-features=Translate,BackForwardCache,MediaRouter',
        `--user-data-dir=${userData}`,
        ...args,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      try {
        child.kill('SIGKILL');
      } catch {
        // already gone
      }
      if (err) reject(err);
      else resolve();
    };
    waitForValidFile(outputPath, 16_000).then(
      () => finish(),
      (err) => finish(err instanceof Error ? err : new Error(String(err)))
    );
    child.on('error', (err) => finish(err));
  });
}

export function hasChromeCapture(): boolean {
  return Boolean(resolveChromePath());
}

export async function screenshotHtml(input: {
  htmlPath: string;
  outputPath: string;
  width: number;
  height: number;
}): Promise<void> {
  const href = pathToFileURL(path.resolve(input.htmlPath)).href;
  const outputPath = path.resolve(input.outputPath);
  await runChrome(
    [
      `--window-size=${Math.max(320, Math.round(input.width))},${Math.max(
        320,
        Math.round(input.height)
      )}`,
      `--screenshot=${outputPath}`,
      href,
    ],
    outputPath
  );
  if (!looksLikeOutput(outputPath)) {
    throw new Error('Chrome không tạo được file PNG hợp lệ.');
  }
}

export async function printHtmlToPdf(input: {
  htmlPath: string;
  outputPath: string;
}): Promise<void> {
  const href = pathToFileURL(path.resolve(input.htmlPath)).href;
  const outputPath = path.resolve(input.outputPath);
  await runChrome(
    [`--print-to-pdf=${outputPath}`, '--no-pdf-header-footer', href],
    outputPath
  );
  if (!looksLikeOutput(outputPath)) {
    throw new Error('Chrome không tạo được file PDF hợp lệ.');
  }
}
