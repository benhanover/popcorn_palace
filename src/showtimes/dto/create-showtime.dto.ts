// src/showtimes/dto/create-showtime.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsDateString,
    Min,
    MaxLength,
    IsPositive,
    Validate
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsEndTimeAfterStartTime } from '../validators/date-time.validator';

export class CreateShowtimeDto {
    @ApiProperty({
        description: 'The ID of the movie being shown',
        example: 1
    })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    movieId: number;

    @ApiProperty({
        description: 'The price of the ticket for this showtime',
        example: 50.2
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    price: number;

    @ApiProperty({
        description: 'The theater where the movie is being shown',
        example: 'Sample Theater'
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    theater: string;

    @ApiProperty({
        description: 'The start time of the showtime (ISO string)',
        example: '2025-02-14T11:47:46.125Z'
    })
    @IsNotEmpty()
    @IsDateString()
    startTime: string;

    @ApiProperty({
        description: 'The end time of the showtime (ISO string)',
        example: '2025-02-14T14:47:46.125Z'
    })
    @IsNotEmpty()
    @IsDateString()
    @Validate(IsEndTimeAfterStartTime, ['startTime'])
    endTime: string;
}