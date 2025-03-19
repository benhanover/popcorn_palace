// src/movies/dto/update-movie.dto.ts
import { IsString, IsNumber, IsOptional, Min, Max, Length, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovieDto {
    @ApiPropertyOptional({
        description: 'The title of the movie',
        example: 'The Shawshank Redemption (Remastered)',
        minLength: 1,
        maxLength: 255
    })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    title?: string;

    @ApiPropertyOptional({
        description: 'The genre of the movie',
        example: 'Drama/Crime',
        minLength: 1,
        maxLength: 100
    })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    genre?: string;

    @ApiPropertyOptional({
        description: 'The duration of the movie in minutes',
        example: 144,
        minimum: 1,
        maximum: 600
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(600)
    duration?: number;

    @ApiPropertyOptional({
        description: 'The rating of the movie on a scale of 0-10',
        example: 9.5,
        minimum: 0,
        maximum: 10
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10)
    rating?: number;

    @ApiPropertyOptional({
        description: 'The year the movie was released',
        example: 1994,
        minimum: 1888,
        maximum: new Date().getFullYear() + 5
    })
    @IsOptional()
    @IsInt()
    @Min(1888)
    @Max(new Date().getFullYear() + 5)
    releaseYear?: number;
}