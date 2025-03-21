// src/bookings/dto/booking-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
    @ApiProperty({
        description: 'The unique identifier of the booking',
        example: 'd1a6423b-4469-4b00-8c5f-e3cfc42eacae'
    })
    bookingId: string;
}