import { v2 as cloudinary } from 'cloudinary';
import { StorageService } from './StorageService.js';
import { LocalStorageService } from './LocalStorageService.js';
import { AppError } from '../../utils/appError.js';

export class CloudinaryStorageService implements StorageService {
  private fallbackService: LocalStorageService;

  constructor() {
    this.fallbackService = new LocalStorageService();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      console.log('Cloudinary Storage Provider initialized successfully.');
    } else {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.warn('WARNING: Production mode active but Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.');
      } else {
        console.log('Cloudinary credentials not set in local environment. Falling back to Local Disk Storage.');
      }
    }
  }

  private isFullyConfigured(): boolean {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    return !!(cloudName && apiKey && apiSecret);
  }

  public async saveFile(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    folder: string
  ): Promise<string> {
    const isConfigured = this.isFullyConfigured();
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isConfigured) {
      if (isProduction) {
        console.error('PRODUCTION ERROR: Cloudinary storage configuration missing. Local filesystem storage is disabled in production environment.');
        throw new AppError('Cloudinary image storage configuration missing in production environment. Upload failed.', 500);
      }
      return this.fallbackService.saveFile(file, folder);
    }

    return new Promise((resolve, reject) => {
      const cleanFolder = `inventory_app/${folder.replace(/\//g, '_')}`;
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: cleanFolder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error occurred during asset stream transfer.');
            return reject(new AppError(`Cloudinary image upload failed: ${error?.message || 'Unknown error'}`, 500));
          }
          // Return secure HTTPS Cloudinary URL
          resolve(result.secure_url);
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  public async deleteFile(fileUrl: string): Promise<void> {
    const isConfigured = this.isFullyConfigured();
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isConfigured || !fileUrl.includes('cloudinary.com')) {
      if (isProduction) {
        console.warn('Production notice: Skipping local file deletion for asset:', fileUrl);
        return;
      }
      return this.fallbackService.deleteFile(fileUrl);
    }

    try {
      // Extract public_id from Cloudinary URL (e.g. inventory_app/products/xyz)
      const urlParts = fileUrl.split('/upload/');
      if (urlParts.length > 1) {
        const pathAfterUpload = urlParts[1];
        // strip version if present e.g. v1234567/
        const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
        const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
        
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
          console.log(`Cloudinary image asset destroyed: ${publicId}`);
        }
      }
    } catch (err: any) {
      console.warn(`Could not delete Cloudinary asset: ${fileUrl}. ${err.message}`);
    }
  }
}

export const storageService: StorageService = new CloudinaryStorageService();
