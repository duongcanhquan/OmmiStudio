import { spawn } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import http from 'http';
import net from 'net';
import path from 'path';
import { pathToFileURL } from 'url';
import { resolveChromePath } from './ChromeCaptureService';
import { resolveFfmpegPath } from './LocalMp4Service';

type CdpResult = Record<string, unknown>;

interface MinimalWebSocket {
  send(data: string): void;
  close(): void;
  onopen: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
    server.on('error', reject);
  });
}

function httpJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk as Buffer));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')) as T);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('CDP timeout'));
    });
  });
}

function openSocket(url: string): Promise<MinimalWebSocket> {
  const WS = (
    globalThis as { WebSocket?: new (href: string) => MinimalWebSocket }
  ).WebSocket;
  if (!WS) {
    throw new Error('Node cần WebSocket (Node 22+) để quay HTML thành MP4.');
  }
  return new Promise((resolve, reject) => {
    const ws = new WS(url);
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error('Không kết nối được Chrome DevTools.'));
  });
}

class CdpClient {
  private nextId = 0;
  private readonly pending = new Map<
    number,
    { resolve: (value: CdpResult) => void; reject: (err: Error) => void }
  >();

  constructor(private readonly ws: MinimalWebSocket) {
    ws.onmessage = (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : String(ev.data);
      let msg: { id?: number; result?: CdpResult; error?: { message?: string } };
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (msg.id == null) return;
      const waiter = this.pending.get(msg.id);
      if (!waiter) return;
      this.pending.delete(msg.id);
      if (msg.error) {
        waiter.reject(new Error(msg.error.message || 'CDP error'));
      } else {
        waiter.resolve(msg.result ?? {});
      }
    };
  }

  send(method: string, params?: Record<string, unknown>): Promise<CdpResult> {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      // already closed
    }
  }
}

async function waitForDebugger(port: number): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < 12_000) {
    try {
      await httpJson<{ Browser?: string }>(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch {
      await sleep(150);
    }
  }
  throw new Error('Chrome không mở cổng DevTools.');
}

async function pageSocketUrl(port: number): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    try {
      const targets = await httpJson<Array<{ type?: string; webSocketDebuggerUrl?: string }>>(
        `http://127.0.0.1:${port}/json/list`
      );
      const page = targets.find(
        (target) => target.type === 'page' && target.webSocketDebuggerUrl
      );
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // chrome still starting
    }
    await sleep(150);
  }
  throw new Error('Không tìm thấy tab Chrome để quay.');
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
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-800) || `ffmpeg exited ${code}`));
    });
  });
}

/**
 * Quay trang HTML đang chạy CSS/JS (blob, chữ chạy, scramble) thành MP4.
 * Một phiên Chrome + CDP — không chụp một khung rồi Ken Burns.
 */
export async function recordHtmlToMp4(input: {
  htmlPath: string;
  outputPath: string;
  width: number;
  height: number;
  seconds: number;
  fps?: number;
}): Promise<void> {
  const chrome = resolveChromePath();
  if (!chrome) {
    throw new Error('Không tìm thấy Chrome/Chromium để quay trang html-video.');
  }
  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) {
    throw new Error('Chưa có FFmpeg để ghép các khung quay thành MP4.');
  }

  const fps = Math.max(8, Math.min(24, input.fps ?? 12));
  const seconds = Math.max(4, Math.min(20, input.seconds));
  const frames = Math.round(seconds * fps);
  const href = pathToFileURL(path.resolve(input.htmlPath)).href;
  const outputPath = path.resolve(input.outputPath);
  const workDir = path.join(path.dirname(outputPath), 'html-record');
  await fsPromises.mkdir(workDir, { recursive: true });

  const port = await freePort();
  const userData = path.join(
    process.env.TMPDIR || '/tmp',
    `lyon-record-${process.pid}-${Date.now()}`
  );
  const child = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      `--remote-debugging-port=${port}`,
      '--remote-debugging-address=127.0.0.1',
      `--window-size=${Math.round(input.width)},${Math.round(input.height)}`,
      `--user-data-dir=${userData}`,
      href,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let cdp: CdpClient | null = null;
  try {
    await waitForDebugger(port);
    const wsUrl = await pageSocketUrl(port);
    cdp = new CdpClient(await openSocket(wsUrl));
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: Math.round(input.width),
      height: Math.round(input.height),
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    await sleep(900);

    for (let i = 0; i < frames; i += 1) {
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 82,
        fromSurface: true,
      });
      const data = typeof shot.data === 'string' ? shot.data : '';
      if (!data) throw new Error('Chrome không trả khung hình.');
      const framePath = path.join(
        workDir,
        `f${String(i).padStart(4, '0')}.jpg`
      );
      await fsPromises.writeFile(framePath, Buffer.from(data, 'base64'));
      await sleep(Math.round(1000 / fps));
    }
  } finally {
    cdp?.close();
    try {
      child.kill('SIGKILL');
    } catch {
      // already gone
    }
    try {
      fs.rmSync(userData, { recursive: true, force: true });
    } catch {
      // tmp cleanup is best-effort
    }
  }

  const first = path.join(workDir, 'f0000.jpg');
  if (!fs.existsSync(first)) {
    throw new Error('Không ghi được khung quay từ Chrome.');
  }

  await runFfmpeg(ffmpeg, [
    '-y',
    '-framerate',
    String(fps),
    '-i',
    path.join(workDir, 'f%04d.jpg'),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    '-movflags',
    '+faststart',
    outputPath,
  ]);

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) {
    throw new Error('FFmpeg không tạo được MP4 từ bản quay HTML.');
  }
}
