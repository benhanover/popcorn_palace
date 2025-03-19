// src/movies/entities/movie.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Movie {
    @ApiProperty({
        description: 'The unique identifier of the movie',
        example: 1,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        description: 'The title of the movie',
        example: 'The Shawshank Redemption',
    })
    @Column({ length: 255 })
    title: string;

    @ApiProperty({
        description: 'The genre of the movie',
        example: 'Drama',
    })
    @Column({ length: 100 })
    genre: string;

    @ApiProperty({
        description: 'The duration of the movie in minutes',
        example: 142,
    })
    @Column()
    duration: number;

    @ApiProperty({
        description: 'The rating of the movie on a scale of 0-10',
        example: 9.3,
    })
    @Column({ type: 'decimal', precision: 3, scale: 1 })
    rating: number;

    @ApiProperty({
        description: 'The year the movie was released',
        example: 1994,
    })
    @Column({ name: 'release_year' })
    releaseYear: number;
}