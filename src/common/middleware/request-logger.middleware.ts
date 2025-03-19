// src/common/middleware/request-logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Generate a unique request ID
    const requestId = uuidv4();
    req['requestId'] = requestId;

    // Extract useful information
    const { method, originalUrl, ip, body } = req;
    const userAgent = req.get('user-agent') || '';

    // Log the incoming request
    this.logger.log(
      `[${requestId}] ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Log request body for POST/PUT/PATCH but exclude sensitive data
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      const logBody = { ...body };
      // Redact any sensitive fields if needed
      // if (logBody.password) logBody.password = '***';
      this.logger.debug(`[${requestId}] Request Body: ${JSON.stringify(logBody)}`);
    }

    // Track timing
    const start = Date.now();

    // Intercept the response
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;
      res.locals.body = body;
      return res.send(body);
    };

    // Log after response is sent
    res.on('finish', () => {
      const responseTime = Date.now() - start;
      const { statusCode } = res;

      // Different log levels based on status code
      const logMessage = `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }

      // Log response body for debugging if needed (be careful with sensitive data)
      if (process.env.NODE_ENV === 'development' && res.locals.body) {
        try {
          const responseBody = JSON.parse(res.locals.body.toString());
          // Skip logging large responses or file downloads
          if (typeof responseBody === 'object' && !Buffer.isBuffer(responseBody)) {
            this.logger.debug(`[${requestId}] Response: ${JSON.stringify(responseBody).substring(0, 1000)}${responseBody.length > 1000 ? '...' : ''}`);
          }
        } catch (e) {
          // Not JSON, skip logging
        }
      }
    });

    next();
  }
}