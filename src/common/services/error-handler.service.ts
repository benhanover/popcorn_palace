import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class ErrorHandlerService {
    private readonly logger = new Logger(ErrorHandlerService.name);

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