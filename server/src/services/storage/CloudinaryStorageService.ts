import { v2 as cloudinary } from 'cloudinary';
import { StorageService } from './StorageService.js';
import { LocalStorageService } from './LocalStorageService.js';
import { AppError } from '../../utils/appError.js';

export class CloudinaryStorageService implements StorageService {
  private fallbackService: LocalStorageService;
  private isConfigured: boolean = false;

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
      this.isConfigured = true;
      console.log('Cloudinary Storage Provider initialized successfully.');
    } else {
      console.log('Cloudinary credentials not set. Falling back to Local Disk Storage.');
    }
  }

  public async saveFile(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    folder: string
  ): Promise<string> {
    if (!this.isConfigured) {
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
            console.error('Cloudinary upload error:', error);
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
    if (!this.isConfigured || !fileUrl.includes('cloudinary.com')) {
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
          console.log(`Cloudinary image destroyed: ${publicId}`);
        }
      }
    } catch (err: any) {
      console.warn(`Could not delete Cloudinary asset: ${fileUrl}. ${err.message}`);
    }
  }
}

export const storageService: StorageService = new CloudinaryStorageService();
