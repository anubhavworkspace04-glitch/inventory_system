export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: any[];
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
