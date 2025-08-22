export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message)
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Not Found") {
        super(message, 404);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = "Bad Request") {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Conflict") {
        super(message, 409);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string = "Service Unavailable") {
        super(message, 503);
    }
}

export class GatewayTimeoutError extends AppError {
    constructor(message: string = "Gateway Timeout") {
        super(message, 504);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string = "Too Many Requests") {
        super(message, 429);
    }
}

export class NotImplementedError extends AppError {
    constructor(message: string = "Not Implemented") {
        super(message, 501);
    }
}

export class BadGatewayError extends AppError {
    constructor(message: string = "Bad Gateway") {
        super(message, 502);
    }
}

export class UnprocessableEntityError extends AppError {
    constructor(message: string = "Unprocessable Entity") {
        super(message, 422);
    }
}

export class PaymentRequiredError extends AppError {
    constructor(message: string = "Payment Required") {
        super(message, 402);
    }
}