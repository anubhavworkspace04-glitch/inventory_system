import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storageService } from '../services/storage/CloudinaryStorageService.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// Set memory storage for Buffer processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new AppError('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.', 400) as any, false);
    }
    cb(null, true);
  }
});

router.post('/image', upload.single('image'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided', 400));
    }

    let folder = 'products';
    if (req.query.folder === 'variants') {
      folder = 'variants';
    } else if (req.query.folder === 'logo') {
      folder = 'business/logo';
    }

    const fileUrl = await storageService.saveFile({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      size: req.file.size
    }, folder);

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
