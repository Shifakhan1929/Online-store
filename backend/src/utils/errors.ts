export interface FieldError {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public statusCode: number;
  public errors?: FieldError[];

  constructor(message: string, statusCode = 500, errors?: FieldError[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors?: FieldError[]) {
    super(message, 400, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', errors?: FieldError[]) {
    super(message, 409, errors);
  }
}

