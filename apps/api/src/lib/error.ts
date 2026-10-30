export class HttpClientError extends Error {
  status: number;
  name;

  constructor(message: string, { status }: { status: number }) {
    super(message);
    this.name = this.constructor.name; // Petit bonus pour retrouver le nom de la classe depuis le contructor
    this.status = status;
  }
}
export class BadRequestError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 400 });
  }
}

export class UnauthorizedError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 401 });
  }
}

export class ForbiddenError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 403 });
  }
}

export class NotFoundError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 404 });
  }
}

export class ConflictError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 409 });
  }
}

export class InternalServerError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 500 });
  }
}

export class ServiceUnavailableError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 503 });
  }
}

export class ForbidenError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 403 });
  }
}
