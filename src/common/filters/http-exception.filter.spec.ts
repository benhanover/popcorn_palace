// src/common/filters/http-exception.filter.spec.ts
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('HttpExceptionFilter', () => {
    let filter: HttpExceptionFilter;
    let mockResponse;
    let mockRequest;
    let mockArgumentsHost;

    beforeEach(async () => {
        // Create mock response with a status function
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // Create mock request
        mockRequest = {
            url: '/test-url',
            method: 'GET',
            requestId: 'test-id-123',
        };

        // Create mock arguments host
        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnThis(),
            getResponse: jest.fn().mockReturnValue(mockResponse),
            getRequest: jest.fn().mockReturnValue(mockRequest),
        };

        // Create an instance of the filter
        filter = new HttpExceptionFilter();

        // Mock Logger methods
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    it('should handle HttpException with status 400', () => {
        // Create a BadRequest exception with message
        const exception = new HttpException('Bad request error', HttpStatus.BAD_REQUEST);

        // Call the filter
        filter.catch(exception, mockArgumentsHost as any);

        // Check if response.status was called with the correct status code
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

        // Check if response.json was called with the error object containing the message
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: HttpStatus.BAD_REQUEST,
                path: '/test-url',
                method: 'GET',
                requestId: 'test-id-123',
                message: 'Bad request error',
            }),
        );

        // Check that warn was called (for 4xx errors)
        expect(Logger.prototype.warn).toHaveBeenCalled();
        expect(Logger.prototype.error).not.toHaveBeenCalled();
    });

    it('should handle HttpException with status 500', () => {
        // Create an Internal Server Error exception
        const exception = new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);

        // Call the filter
        filter.catch(exception, mockArgumentsHost as any);

        // Check if response.status was called with the correct status code
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

        // Check if error was logged (for 5xx errors)
        expect(Logger.prototype.error).toHaveBeenCalled();
        expect(Logger.prototype.warn).not.toHaveBeenCalled();
    });

    it('should handle HttpException with object response', () => {
        // Create exception with an object response
        const exception = new HttpException(
            { message: ['validation error 1', 'validation error 2'], error: 'Bad Request' },
            HttpStatus.BAD_REQUEST,
        );

        // Call the filter
        filter.catch(exception, mockArgumentsHost as any);

        // Check response
        expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: ['validation error 1', 'validation error 2'],
            }),
        );
    });
});