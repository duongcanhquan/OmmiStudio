import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Manages ephemeral job folders under /server/workspaces.
 *
 * Each render job gets an isolated directory so CLI tools can read inputs
 * (config JSON, HTML) and write outputs without colliding with other jobs.
 */
export class WorkspaceService {
  private readonly rootDir: string;

  constructor(rootDir?: string) {
    // Resolve against the server package root so paths stay stable whether
    // we run via `tsx` (src/) or compiled `node dist/` output.
    this.rootDir = rootDir ?? path.resolve(__dirname, '../../workspaces');
  }

  /**
   * Create a unique workspace folder using a timestamp + UUID suffix.
   * Returns the absolute path to the new directory.
   */
  async createWorkspace(): Promise<string> {
    await fs.mkdir(this.rootDir, { recursive: true });

    const folderName = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    const workspacePath = path.join(this.rootDir, folderName);

    await fs.mkdir(workspacePath, { recursive: true });
    return workspacePath;
  }

  /**
   * Write a JSON payload or HTML/text string into a file inside the workspace.
   * Creates parent directories if needed.
   */
  async writeFile(
    workspacePath: string,
    filename: string,
    data: string | object
  ): Promise<string> {
    const filePath = path.join(workspacePath, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const contents =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    await fs.writeFile(filePath, contents, 'utf-8');
    return filePath;
  }

  /** Ensure a directory exists (e.g. workspace/output). */
  async ensureDir(dirPath: string): Promise<string> {
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
  }

  /**
   * Recursively delete a workspace folder after a job finishes (or fails).
   * Safe no-op if the path does not exist. Refuses to delete outside rootDir.
   */
  async cleanup(workspacePath: string): Promise<void> {
    const resolved = path.resolve(workspacePath);
    const root = path.resolve(this.rootDir);
    const rel = path.relative(root, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(
        `Refusing to cleanup path outside workspaces root: ${resolved}`
      );
    }
    await fs.rm(resolved, { recursive: true, force: true });
  }
}

export const workspaceService = new WorkspaceService();
