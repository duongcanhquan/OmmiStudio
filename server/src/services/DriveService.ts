import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { google, type drive_v3 } from 'googleapis';
import { configManager } from '../config/ConfigManager';

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink?: string | null;
  name: string;
  mimeType: string;
}

type ServiceAccountCreds = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
  [key: string]: unknown;
};

function parseServiceAccountJson(raw: string): ServiceAccountCreds {
  try {
    const parsed = JSON.parse(raw) as ServiceAccountCreds;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        'Service Account JSON phải có client_email và private_key.'
      );
    }
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON Service Account không hợp lệ: ${message}`);
  }
}

/**
 * Google Drive uploads via Service Account JSON stored in ConfigManager.
 */
export class DriveService {
  private drive: drive_v3.Drive | null = null;
  private cacheKey = '';

  constructor() {
    configManager.onChange(() => {
      this.drive = null;
      this.cacheKey = '';
    });
  }

  isConfigured(): boolean {
    const { drive } = configManager.getConfig();
    return Boolean(
      drive.enabled &&
        drive.folderId.trim() &&
        drive.serviceAccountJson.trim() &&
        !drive.serviceAccountJson.includes('[REDACTED]')
    );
  }

  private getFolderId(): string {
    const folder = configManager.getConfig().drive.folderId?.trim();
    if (!folder) {
      throw new Error(
        'Vui lòng cấu hình Folder ID Google Drive trong mục Cài đặt → Cloud Storage.'
      );
    }
    return folder;
  }

  private async getClient(
    serviceAccountJsonOverride?: string
  ): Promise<drive_v3.Drive> {
    const raw =
      serviceAccountJsonOverride?.trim() ||
      configManager.getConfig().drive.serviceAccountJson.trim();
    if (!raw || raw.includes('[REDACTED]')) {
      throw new Error(
        'Vui lòng dán Service Account JSON trong mục Cài đặt → Cloud Storage.'
      );
    }

    if (this.drive && this.cacheKey === raw && !serviceAccountJsonOverride) {
      return this.drive;
    }

    const credentials = parseServiceAccountJson(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const client = google.drive({ version: 'v3', auth });
    if (!serviceAccountJsonOverride) {
      this.drive = client;
      this.cacheKey = raw;
    }
    return client;
  }

  async uploadFile(
    filePath: string,
    fileName: string,
    mimeType: string
  ): Promise<DriveUploadResult> {
    if (!configManager.getConfig().drive.enabled) {
      throw new Error(
        'Tính năng tải lên Google Drive đang tắt. Bật trong Cài đặt → Cloud Storage.'
      );
    }

    const absolutePath = path.resolve(filePath);
    await fsp.access(absolutePath);

    const drive = await this.getClient();
    const folderId = this.getFolderId();

    const created = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: fs.createReadStream(absolutePath),
      },
      fields: 'id, name, webViewLink, webContentLink, mimeType',
      supportsAllDrives: true,
    });

    const fileId = created.data.id;
    if (!fileId) {
      throw new Error('Tải lên Drive thành công nhưng không nhận được file id.');
    }

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });

    const meta = await drive.files.get({
      fileId,
      fields: 'id, name, webViewLink, webContentLink, mimeType',
      supportsAllDrives: true,
    });

    const webViewLink =
      meta.data.webViewLink ||
      `https://drive.google.com/file/d/${fileId}/view`;

    return {
      fileId,
      webViewLink,
      webContentLink: meta.data.webContentLink,
      name: meta.data.name || fileName,
      mimeType: meta.data.mimeType || mimeType,
    };
  }

  /** Connectivity probe for Settings → Test Drive. */
  async testConnection(overrides?: {
    serviceAccountJson?: string;
    folderId?: string;
  }): Promise<{ ok: boolean; message: string }> {
    try {
      const raw =
        overrides?.serviceAccountJson?.trim() ||
        configManager.getConfig().drive.serviceAccountJson.trim();
      if (
        !raw ||
        raw.includes('[REDACTED]') ||
        raw.includes('•') ||
        raw.includes('...')
      ) {
        return {
          ok: false,
          message:
            'Vui lòng dán toàn bộ Service Account JSON để kiểm tra kết nối Drive.',
        };
      }

      const folderId =
        overrides?.folderId?.trim() ||
        configManager.getConfig().drive.folderId.trim();
      if (!folderId) {
        return {
          ok: false,
          message: 'Vui lòng nhập Google Drive Folder ID.',
        };
      }

      const drive = await this.getClient(raw);
      const listed = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        pageSize: 1,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const creds = parseServiceAccountJson(raw);
      return {
        ok: true,
        message: `Kết nối Drive thành công với ${creds.client_email}. Thư mục truy cập được (${listed.data.files?.length ?? 0} tệp mẫu).`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Không kết nối được Drive: ${message}. Hãy chia sẻ thư mục cho email của Service Account (quyền Editor).`,
      };
    }
  }
}

export const driveService = new DriveService();

export default driveService;

export function mimeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.html':
    case '.htm':
      return 'text/html';
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
