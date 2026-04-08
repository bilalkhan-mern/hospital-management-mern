import multer from 'multer';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError.js';

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new AppError('Only PDF, JPG, PNG, and WEBP files are allowed.', StatusCodes.BAD_REQUEST));
      return;
    }

    cb(null, true);
  },
});

export const handleReportUpload = (req, res, next) => {
  reportUpload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('File size must be 5MB or smaller.', StatusCodes.BAD_REQUEST));
      return;
    }

    next(error);
  });
};
