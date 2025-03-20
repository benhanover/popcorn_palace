/*
The CommonModule in this NestJS application serves as a centralized module for application-wide utilities and configurations. It primarily focuses on providing a shared ErrorHandlerService that translates low-level database errors into meaningful HTTP exceptions, and globally registers the HttpExceptionFilter to ensure consistent error handling across the entire application. By exporting the ErrorHandlerService, this module allows other modules like MoviesModule to inject and use the service for standardized error management. The use of APP_FILTER with HttpExceptionFilter ensures that all HTTP exceptions are caught and processed uniformly, providing a clean, centralized approach to handling errors with contextual logging and structured error responses. This design promotes separation of concerns, making the error handling mechanism modular, extensible, and easy to maintain across different parts of the application.
*/
import { Module } from '@nestjs/common';
import { ErrorHandlerService } from './services/error-handler.service';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
    providers: [
        ErrorHandlerService,
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
    exports: [ErrorHandlerService],
})
export class CommonModule { }