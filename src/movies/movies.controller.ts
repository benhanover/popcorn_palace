import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) { }

    @Get('all')
    findAll(): Promise<Movie[]> {
        return this.moviesService.findAll();
    }

    @Post()
    create(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
        return this.moviesService.create(createMovieDto);
    }

    @Post('update/:movieTitle')
    update(
        @Param('movieTitle') movieTitle: string,
        @Body() updateMovieDto: UpdateMovieDto,
    ): Promise<void> {
        return this.moviesService.update(movieTitle, updateMovieDto);
    }

    @Delete(':movieTitle')
    @HttpCode(HttpStatus.OK)
    delete(@Param('movieTitle') movieTitle: string): Promise<void> {
        return this.moviesService.delete(movieTitle);
    }
}