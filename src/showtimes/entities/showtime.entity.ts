// src/showtimes/entities/showtime.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Showtime {
    @ApiProperty({
        description: 'The unique identifier of the showtime',
        example: 1,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        description: 'The price of the ticket for this showtime',
        example: 50.2,
    })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ApiProperty({
        description: 'The ID of the movie being shown',
        example: 1,
    })
    @Column({ name: 'movie_id' })
    movieId: number;

    @ApiProperty({
        description: 'The theater where the movie is being shown',
        example: 'Sample Theater',
    })
    @Column({ length: 255 })
    theater: string;

    @ApiProperty({
        description: 'The start time of the showtime',
        example: '2025-02-14T11:47:46.125405Z',
    })
    @Column({ name: 'start_time', type: 'timestamptz' })
    startTime: Date;

    @ApiProperty({
        description: 'The end time of the showtime',
        example: '2025-02-14T14:47:46.125405Z',
    })
    @Column({ name: 'end_time', type: 'timestamptz' })
    endTime: Date;
}