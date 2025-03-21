// src/bookings/bookings.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { CommonModule } from '../common/common.module';
import { ShowtimesModule } from '../showtimes/showtimes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    CommonModule,
    ShowtimesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}