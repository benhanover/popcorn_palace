// src/showtimes/dto/update-showtime.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsNumber,
    IsString,
    IsDateString,
    MaxLength,
    IsPositive,
    Validate
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsEndTimeAfterStartTime } from '../validators/date-time.validator';

export class UpdateShowtimeDto {
    @ApiPropertyOptional({
        description: 'The ID of the movie being shown',
        example: 1
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    movieId?: number;

    @ApiPropertyOptional({
        description: 'The price of the ticket for this showtime',
        example: 50.2
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    price?: number;

    @ApiPropertyOptional({
        description: 'The theater where the movie is being shown',
        example: 'Sample Theater'
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    theater?: string;

    @ApiPropertyOptional({
        description: 'The start time of the showtime (ISO string)',
        example: '2025-02-14T11:47:46.125Z'
    })
    @IsOptional()
    @IsDateString()
    startTime?: string;

    @ApiPropertyOptional({
        description: 'The end time of the showtime (ISO string)',
        example: '2025-02-14T14:47:46.125Z'
    })
    @IsOptional()
    @IsDateString()
    @Validate(IsEndTimeAfterStartTime, ['startTime'])
    endTime?: string;
}