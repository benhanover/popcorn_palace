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