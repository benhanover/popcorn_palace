// src/common/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const errorResponse = exception.getResponse();
        const requestId = request['requestId'] || 'unknown';

        // Create a readable error message
        const errorMessage =
            typeof errorResponse === 'object' && 'message' in errorResponse
                ? errorResponse['message']
                : exception.message;

        const errorObj = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId,
            message: errorMessage,
        };

        // Log the error with context
        if (status >= 500) {
            this.logger.error(
                `[${requestId}] ${request.method} ${request.url} ${status}: ${JSON.stringify(errorMessage)}`,
                exception.stack,
            );
        } else if (status >= 400) {
            this.logger.warn(
                `[${requestId}] ${request.method} ${request.url} ${status}: ${JSON.stringify(errorMessage)}`,
            );
        }

        // Send the error response
        response.status(status).json(errorObj);
    }
}