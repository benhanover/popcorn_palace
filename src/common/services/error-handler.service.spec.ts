// src/common/services/error-handler.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from './error-handler.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ErrorHandlerService],
        }).compile();

        service = module.get<ErrorHandlerService>(ErrorHandlerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('handleDatabaseError', () => {
        it('should handle unique violation', () => {
            const error = { code: '23505', message: 'Duplicate key value' };

            try {
                service.handleDatabaseError(error, 'test operation');
                fail('Should have thrown an error');
            } catch (e) {
                expect(e).toBeInstanceOf(ConflictException);
                expect(e.message).toBe('Resource already exists');
            }
        });

        it('should handle foreign key violation', () => {
            const error = { code: '23503', message: 'Foreign key violation' };

            try {
                service.handleDatabaseError(error, 'test operation');
                fail('Should have thrown an error');
            } catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.message).toBe('Related resource not found');
            }
        });

        it('should handle invalid UUID format', () => {
            const error = { code: '22P02', message: 'Invalid text representation' };

            try {
                service.handleDatabaseError(error, 'test operation');
                fail('Should have thrown an error');
            } catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.message).toBe('Invalid ID format');
            }
        });

        it('should handle TypeORM QueryFailedError', () => {
            const error = new QueryFailedError('SELECT * FROM nonexistent', [], new Error('Query failed'));

            try {
                service.handleDatabaseError(error, 'test operation');
                fail('Should have thrown an error');
            } catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.message).toContain('Query failed');
            }
        });

        it('should handle generic errors', () => {
            const error = new Error('Generic error');

            try {
                service.handleDatabaseError(error, 'test operation');
                fail('Should have thrown an error');
            } catch (e) {
                expect(e).toBeInstanceOf(BadRequestException);
                expect(e.message).toContain('Operation failed');
            }
        });
    });
});