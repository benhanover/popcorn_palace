import { IsString, IsNumber, IsOptional, Min, Max, Length, IsInt } from 'class-validator';

export class UpdateMovieDto {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    title?: string;

    @IsOptional()
    @IsString()
    @Length(1, 100)
    genre?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(600)
    duration?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10)
    rating?: number;

    @IsOptional()
    @IsInt()
    @Min(1888)
    @Max(new Date().getFullYear() + 5)
    releaseYear?: number;
}