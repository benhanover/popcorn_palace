import { IsString, IsNumber, IsNotEmpty, Min, Max, Length, IsInt } from 'class-validator';

export class CreateMovieDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    title: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    genre: string;

    @IsInt()
    @Min(1)
    @Max(600) // Assuming no movie is longer than 10 hours
    duration: number;

    @IsNumber()
    @Min(0)
    @Max(10) // Assuming a rating scale of 0-10
    rating: number;

    @IsInt()
    @Min(1888) // First movie year
    @Max(new Date().getFullYear() + 5) // Allow for upcoming releases
    releaseYear: number;
}