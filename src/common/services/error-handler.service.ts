/* Description -
The ErrorHandlerService provides centralized database error handling throughout the application, transforming low-level database errors into meaningful HTTP exceptions. When database operations fail, this service logs detailed error information and then maps specific PostgreSQL error codes to appropriate HTTP exceptions - converting unique constraint violations to 409 Conflict errors, foreign key violations to 400 Bad Request errors, and malformed UUID inputs to validation errors. It also handles TypeORM-specific exceptions and provides fallback error handling for unexpected issues. By centralizing this logic, the service ensures consistent error responses across all API endpoints, improves error traceability through structured logging, and prevents sensitive database implementation details from leaking into API responses, enhancing both security and user experience.
*/

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class ErrorHandlerService {
    private readonly logger = new Logger('DatabaseErrors');

    handleDatabaseError(error: any, operation: string): never {
        this.logger.error(`Database error during ${operation}: ${error.message}`, error.stack);

        // Handle PostgreSQL error codes
        if (error.code) {
            switch (error.code) {
                case '23505': // Unique violation
                    throw new ConflictException('Resource already exists');
                case '23503': // Foreign key violation
                    throw new BadRequestException('Related resource not found');
                case '22P02': // Invalid text representation (often from invalid UUID)
                    throw new BadRequestException('Invalid ID format');
                default:
                    throw new BadRequestException(`Database error: ${error.message}`);
            }
        }

        // Handle TypeORM errors
        if (error instanceof QueryFailedError) {
            throw new BadRequestException(`Query failed: ${error.message}`);
        }

        // Default error handling
        throw new BadRequestException(`Operation failed: ${error.message}`);
    }
}