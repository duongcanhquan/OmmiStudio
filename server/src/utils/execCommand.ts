import { exec, type ExecException } from 'child_process';
import path from 'path';

export interface ExecCommandResult {
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

export interface ExecCommandOptions {
  /** Working directory for the child process (resolved to absolute) */
  cwd?: string;
  /** Override default maxBuffer (10 MB) */
  maxBuffer?: number;
  /** Kill the process after this many ms. Default: none. */
  timeout?: number;
  /** AbortSignal for caller-driven cancellation */
  signal?: AbortSignal;
}

/**
 * Run a shell command asynchronously.
 * Always settles the Promise (never crashes the process) — callers get a
 * rejected Error with stdout/stderr attached for API-level handling.
 */
export function execCommand(
  command: string,
  options: ExecCommandOptions = {}
): Promise<ExecCommandResult> {
  const {
    cwd,
    maxBuffer = 10 * 1024 * 1024,
    timeout,
    signal,
  } = options;

  const absoluteCwd = cwd ? path.resolve(cwd) : undefined;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error(`Command aborted before start: ${command}`));
      return;
    }

    let settled = false;
    const child = exec(
      command,
      {
        cwd: absoluteCwd,
        maxBuffer,
        timeout: timeout && timeout > 0 ? timeout : undefined,
        windowsHide: true,
        encoding: 'utf8',
      },
      (error: ExecException | null, stdout, stderr) => {
        if (settled) return;
        settled = true;

        const out = String(stdout ?? '').trim();
        const err = String(stderr ?? '').trim();
        const timedOut = Boolean(
          error && (error as ExecException & { killed?: boolean }).killed && timeout
        );

        if (error) {
          const wrapped = new Error(
            [
              timedOut
                ? `Command timed out after ${timeout}ms: ${command}`
                : `Command failed: ${command}`,
              absoluteCwd ? `cwd: ${absoluteCwd}` : '',
              `exitCode: ${error.code ?? 'unknown'}`,
              error.message,
              err ? `stderr:\n${err}` : '',
              out ? `stdout:\n${out}` : '',
            ]
              .filter(Boolean)
              .join('\n')
          );
          (wrapped as Error & { stdout?: string; stderr?: string; timedOut?: boolean }).stdout =
            out;
          (wrapped as Error & { stderr?: string }).stderr = err;
          (wrapped as Error & { timedOut?: boolean }).timedOut = timedOut;
          reject(wrapped);
          return;
        }

        resolve({ stdout: out, stderr: err, timedOut: false });
      }
    );

    const onAbort = () => {
      if (settled) return;
      try {
        child.kill();
      } catch {
        // ignore
      }
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    child.on('exit', () => {
      signal?.removeEventListener('abort', onAbort);
    });
  });
}

/** Quote a path for safe embedding in a shell command (Windows + POSIX). */
export function quoteShellArg(value: string): string {
  const normalized = path.resolve(value);
  if (process.platform === 'win32') {
    return `"${normalized.replace(/"/g, '\\"')}"`;
  }
  return `'${normalized.replace(/'/g, `'\\''`)}'`;
}

/** Quote a free-form string (not necessarily a path). */
export function quoteShellString(value: string): string {
  if (process.platform === 'win32') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
