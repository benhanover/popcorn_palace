// src/bookings/dto/create-booking.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsUUID,
    Min,
    Max
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
    @ApiProperty({
        description: 'The ID of the showtime to book',
        example: 1
    })
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    showtimeId: number;

    @ApiProperty({
        description: 'The seat number to book',
        example: 15
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(100) // Assuming a maximum of 100 seats per theater
    @Type(() => Number)
    seatNumber: number;

    @ApiProperty({
        description: 'The ID of the user making the booking',
        example: '84438967-f68f-4fa0-b620-0f08217e76af'
    })
    @IsNotEmpty()
    @IsString()
    @IsUUID('4')
    userId: string;
}