// src/movies/dto/create-movie.dto.ts
import { IsString, IsNumber, IsNotEmpty, Min, Max, Length, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
    @ApiProperty({
        description: 'The title of the movie',
        example: 'The Shawshank Redemption',
        minLength: 1,
        maxLength: 255
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    title: string;

    @ApiProperty({
        description: 'The genre of the movie',
        example: 'Drama',
        minLength: 1,
        maxLength: 100
    })
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    genre: string;

    @ApiProperty({
        description: 'The duration of the movie in minutes',
        example: 142,
        minimum: 1,
        maximum: 600
    })
    @IsInt()
    @Min(1)
    @Max(600)
    duration: number;

    @ApiProperty({
        description: 'The rating of the movie on a scale of 0-10',
        example: 9.3,
        minimum: 0,
        maximum: 10
    })
    @IsNumber()
    @Min(0)
    @Max(10)
    rating: number;

    @ApiProperty({
        description: 'The year the movie was released',
        example: 1994,
        minimum: 1888,
        maximum: new Date().getFullYear() + 5
    })
    @IsInt()
    @Min(1888)
    @Max(new Date().getFullYear() + 5)
    releaseYear: number;
}