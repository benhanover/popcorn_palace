// src/bookings/entities/booking.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Booking {
    @ApiProperty({
        description: 'The unique identifier of the booking',
        example: 'd1a6423b-4469-4b00-8c5f-e3cfc42eacae',
    })
    @PrimaryGeneratedColumn('uuid')
    bookingId: string;

    @ApiProperty({
        description: 'The ID of the showtime being booked',
        example: 1,
    })
    @Column({ name: 'showtime_id' })
    showtimeId: number;

    @ApiProperty({
        description: 'The seat number being booked',
        example: 15,
    })
    @Column()
    seatNumber: number;

    @ApiProperty({
        description: 'The ID of the user making the booking',
        example: '84438967-f68f-4fa0-b620-0f08217e76af',
    })
    @Column({ name: 'user_id' })
    userId: string;

    @ApiProperty({
        description: 'The timestamp when the booking was created',
        example: '2025-03-21T14:30:00.000Z',
    })
    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}