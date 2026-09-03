import path from 'path';
import {
  assertCliExists,
  type NexuToolName,
} from '../config/nexu-tools';
import { execCommand, quoteShellArg, quoteShellString, type ExecCommandResult } from '../utils/execCommand';
import { workspaceService } from './WorkspaceService';

export interface NexuPipelinePayload {
  content: string;
  templateId: string;
  /** Extra fields forwarded into input.json for future CLI flags */
  [key: string]: unknown;
}

export interface NexuPipelineOptions {
  /**
   * Which vendor CLI to invoke. Defaults to `html-anything` for static HTML.
   * Swap to `motion-anything` / `html-video` as those endpoints land.
   */
  tool?: NexuToolName;
  /**
   * Optional override of the argv after `node <cli>`.
   * If omitted, a sensible default per tool is built from workspace paths.
   *
   * Keep this flexible — nexu CLIs evolve; adjust flags here without
   * touching the Express controller.
   */
  buildArgs?: (ctx: NexuCommandContext) => string[];
}

export interface NexuCommandContext {
  cliPath: string;
  workspaceDir: string;
  inputJsonPath: string;
  outputHtmlPath: string;
  outputDir: string;
  payload: NexuPipelinePayload;
}

export interface NexuPipelineResult {
  workspaceDir: string;
  inputJsonPath: string;
  outputHtmlPath: string;
  tool: NexuToolName;
  command: string;
  execution: ExecCommandResult;
}

/**
 * Default argv builders per tool.
 *
 * Flags are intentionally conservative placeholders that match the shape
 * documented in LYON Studio (`--input` / `--output`). When a tool's real
 * CLI differs (e.g. html-anything uses `convert -t … -o …`), we adapt here.
 */
function defaultArgsForTool(
  tool: NexuToolName,
  ctx: NexuCommandContext
): string[] {
  const input = quoteShellArg(ctx.inputJsonPath);
  const outputHtml = quoteShellArg(ctx.outputHtmlPath);
  const outputDir = quoteShellArg(ctx.outputDir);
  const workspace = quoteShellArg(ctx.workspaceDir);
  const template = quoteShellString(String(ctx.payload.templateId));

  switch (tool) {
    case 'html-anything':
      // Real CLI: html-anything convert <file> -t <template> -o <out>
      // We also write input.md alongside input.json for convert-friendly flow.
      return [
        'convert',
        quoteShellArg(path.join(ctx.workspaceDir, 'input.md')),
        '-t',
        template,
        '-o',
        outputHtml,
      ];

    case 'motion-anything':
      // Placeholder batch flags — motion.js today is primarily `serve <port>`.
      // Adjust once a headless `--input/--output` path is confirmed upstream.
      return [
        '--input',
        input,
        '--output',
        outputHtml,
        '--workspace',
        workspace,
      ];

    case 'html-video':
      // Placeholder; real subcommands include `studio`, `doctor`, `search-templates`.
      return [
        'render',
        '--input',
        input,
        '--output',
        outputDir,
      ];

    case 'open-design':
      return ['--input', input, '--output', outputDir];

    default: {
      const _exhaustive: never = tool;
      return _exhaustive;
    }
  }
}

/**
 * Core orchestrator:
 *  1. Persist the user payload as `input.json` (+ `input.md` for html-anything)
 *  2. Resolve the vendor CLI absolute path
 *  3. Spawn `node <cli> …` via execCommand
 *
 * Example command shape (motion-anything / generic):
 *   node ${cli} --input ${workspace}/input.json --output ${workspace}/output.html
 */
export async function executeNexuPipeline(
  payload: NexuPipelinePayload,
  workspaceDir: string,
  options: NexuPipelineOptions = {}
): Promise<NexuPipelineResult> {
  const tool: NexuToolName = options.tool ?? 'html-anything';

  const inputJsonPath = await workspaceService.writeFile(
    workspaceDir,
    'input.json',
    {
      ...payload,
      createdAt: new Date().toISOString(),
    }
  );

  // html-anything convert expects a content file (markdown/text), not only JSON.
  await workspaceService.writeFile(
    workspaceDir,
    'input.md',
    String(payload.content)
  );

  const outputDir = path.join(workspaceDir, 'output');
  await workspaceService.ensureDir(outputDir);

  const outputHtmlPath = path.join(workspaceDir, 'output.html');
  const cliPath = assertCliExists(tool);

  const ctx: NexuCommandContext = {
    cliPath,
    workspaceDir,
    inputJsonPath,
    outputHtmlPath,
    outputDir,
    payload,
  };

  const args = options.buildArgs
    ? options.buildArgs(ctx)
    : defaultArgsForTool(tool, ctx);

  // Use `node` for .js entrypoints; fall back to `npx tsx` if we resolved a .ts file.
  const runner = cliPath.endsWith('.ts')
    ? `npx tsx ${quoteShellArg(cliPath)}`
    : `node ${quoteShellArg(cliPath)}`;

  const command = [runner, ...args].join(' ');

  const execution = await execCommand(command, {
    cwd: workspaceDir,
    // Agent-backed renders can take several minutes
    timeout: 10 * 60 * 1000,
  });

  return {
    workspaceDir,
    inputJsonPath,
    outputHtmlPath,
    tool,
    command,
    execution,
  };
}
