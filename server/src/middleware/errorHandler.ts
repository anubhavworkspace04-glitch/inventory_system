import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for developers locally
  console.error('ERROR 💥:', err);

  // Mongoose Bad ObjectId cast error
  if (err.name === 'CastError') {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0] : 'value';
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, 400);
  }

  // Mongoose Validation error
  if (err.name === 'ValidationError') {
    const errorsMsg = Object.values(err.errors).map((el: any) => el.message);
    const message = `Invalid input data. Errors: ${errorsMsg.join(', ')}`;
    error = new AppError(message, 400, errorsMsg);
  }

  // Zod Validation error (from request schemas)
  if (err.name === 'ZodError') {
    const errorsMsg = err.errors.map((el: any) => `${el.path.join('.')}: ${el.message}`);
    const message = `Invalid request body input.`;
    error = new AppError(message, 400, errorsMsg);
  }

  // Standardized Error Response Format
  res.status(error.statusCode).json({
    success: false,
    message: error.message || 'Something went wrong',
    errors: error.errors || []
  });
};
