export class AppError extends Error {
  constructor(
    public readonly message = 'Internal server error',
    public readonly statusCode = 500,
    public readonly code = 'INTERNAL_SERVER_ERROR',
  ) {
    super();
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  public readonly statusCode = 400;

  constructor(public readonly message = 'Bad Request', public readonly code = 'BAD_REQUEST') {
    super();
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;

  constructor(public readonly message = 'Unauthorized', public readonly code = 'UNAUTHORIZED') {
    super();
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;

  constructor(public readonly message = 'Forbidden', public readonly code = 'FORBIDDEN') {
    super();
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;

  constructor(public readonly message = 'Not found', public readonly code = 'NOT_FOUND') {
    super();
  }
}

export class EntityNotFoundError<T extends { toString(): string }> extends NotFoundError {
  constructor(public readonly id: T, public readonly entity: string) {
    super(
      `Could not find any matching record: ${id.toString()} for entity of type ${entity}`,
      `${entity.toUpperCase()}_NOT_FOUND`,
    );
  }
}

export class RequestTimeoutError extends AppError {
  public readonly statusCode = 408;

  constructor(
    public readonly message = 'Request timeout',
    public readonly code = 'REQUEST_TIMEOUT',
  ) {
    super();
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;

  constructor(public readonly message = 'Conflict', public readonly code = 'CONFLICT') {
    super();
  }
}

export class TooManyRequest extends AppError {
  public readonly statusCode = 429;

  constructor(
    public readonly message = 'Too many requests, please try again later.',
    public readonly code = 'TOO_MANY_REQUEST',
  ) {
    super();
  }
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
}
