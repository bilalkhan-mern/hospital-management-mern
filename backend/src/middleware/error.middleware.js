import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, StatusCodes.NOT_FOUND));
};

export const errorHandler = (err, _req, res, _next) => {
  if (err.code === 11000) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: 'Duplicate record detected.',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong.',
  });
};
