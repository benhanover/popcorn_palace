// src/bookings/bookings.service.ts
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { ShowtimesService } from '../showtimes/showtimes.service';

@Injectable()
export class BookingsService {
    private readonly logger = new Logger(BookingsService.name);

    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
        private errorHandlerService: ErrorHandlerService,
        private showtimesService: ShowtimesService,
    ) {}

    async create(createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
        try {
            // Check if the showtime exists
            await this.showtimesService.findById(createBookingDto.showtimeId);

            // Check if the seat is already booked for this showtime
            await this.checkSeatAvailability(
                createBookingDto.showtimeId,
                createBookingDto.seatNumber
            );

            // Create and save the booking
            const booking = this.bookingsRepository.create(createBookingDto);
            const savedBooking = await this.bookingsRepository.save(booking);

            this.logger.log(
                `Booking created: showtimeId=${createBookingDto.showtimeId}, seatNumber=${createBookingDto.seatNumber}, userId=${createBookingDto.userId}`
            );

            return {
                bookingId: savedBooking.bookingId
            };
        } catch (error) {
            // Let NotFoundException and ConflictException pass through
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'create booking');
        }
    }

    private async checkSeatAvailability(showtimeId: number, seatNumber: number): Promise<void> {
        try {
            const existingBooking = await this.bookingsRepository.findOne({
                where: {
                    showtimeId,
                    seatNumber
                }
            });

            if (existingBooking) {
                this.logger.warn(
                    `Seat booking conflict: showtimeId=${showtimeId}, seatNumber=${seatNumber}`
                );
                throw new ConflictException(
                    `Seat ${seatNumber} is already booked for showtime ${showtimeId}`
                );
            }

            this.logger.log(
                `Seat availability check passed: showtimeId=${showtimeId}, seatNumber=${seatNumber}`
            );
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(
                error,
                'checking seat availability'
            );
        }
    }
}