// src/bookings/bookings.controller.ts
import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiConflictResponse
} from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) {}

    @ApiOperation({ summary: 'Book a ticket' })
    @ApiBody({ type: CreateBookingDto })
    @ApiResponse({
        status: 200,
        description: 'Ticket booked successfully',
        type: BookingResponseDto
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Showtime not found' })
    @ApiConflictResponse({ description: 'Seat already booked for this showtime' })
    @Post()
    @HttpCode(HttpStatus.OK)
    create(@Body() createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
        return this.bookingsService.create(createBookingDto);
    }
}