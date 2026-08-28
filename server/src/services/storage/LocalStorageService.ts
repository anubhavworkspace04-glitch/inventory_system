import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageService } from './StorageService.js';
import { AppError } from '../../utils/appError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root uploads directory path: inventory_app/server/uploads
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

export class LocalStorageService implements StorageService {
  constructor() {
    // Ensure root uploads folder and subfolders exist
    this.ensureDirExists(UPLOADS_DIR);
    this.ensureDirExists(path.join(UPLOADS_DIR, 'products'));
    this.ensureDirExists(path.join(UPLOADS_DIR, 'variants'));
    this.ensureDirExists(path.join(UPLOADS_DIR, 'business/logo'));
  }

  private async ensureDirExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  public async saveFile(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    folder: string
  ): Promise<string> {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const prefix = folder.replace(/\//g, '-');
      const uniqueName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      
      const targetFolder = path.join(UPLOADS_DIR, folder);
      await this.ensureDirExists(targetFolder);

      const targetPath = path.join(targetFolder, uniqueName);
      
      // Save file buffer to local disk
      await fs.writeFile(targetPath, file.buffer);
      
      // Return accessible relative web URL
      return `/uploads/${folder}/${uniqueName}`;
    } catch (err: any) {
      throw new AppError(`File write error: ${err.message}`, 500);
    }
  }

  public async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Validate path traversal security checks
      if (!fileUrl.startsWith('/uploads/')) return;
      
      // Resolve absolute local path
      const relativePath = fileUrl.replace('/uploads/', '');
      const absolutePath = path.join(UPLOADS_DIR, relativePath);

      // Verify that target path is still inside the uploads directory boundaries
      if (!absolutePath.startsWith(UPLOADS_DIR)) {
        throw new AppError('Unauthorized file access path traversal attempt', 400);
      }

      await fs.unlink(absolutePath);
    } catch (err: any) {
      // Fail silently if old file does not exist or was already deleted
      console.warn(`Could not delete image file: ${fileUrl}. ${err.message}`);
    }
  }
}
export const storageService = new LocalStorageService();
