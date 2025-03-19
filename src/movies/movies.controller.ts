// src/movies/movies.controller.ts
import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiConflictResponse
} from '@nestjs/swagger';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) { }

    @ApiOperation({ summary: 'Get all movies' })
    @ApiResponse({
        status: 200,
        description: 'Returns a list of all movies',
        type: [Movie]
    })
    @Get('all')
    findAll(): Promise<Movie[]> {
        return this.moviesService.findAll();
    }

    @ApiOperation({ summary: 'Create a new movie' })
    @ApiBody({ type: CreateMovieDto })
    @ApiResponse({
        status: 200,
        description: 'Movie created successfully',
        type: Movie
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Movie with this title already exists' })
    @Post()
    create(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
        return this.moviesService.create(createMovieDto);
    }

    @ApiOperation({ summary: 'Update an existing movie' })
    @ApiParam({ name: 'movieTitle', description: 'The title of the movie to update' })
    @ApiBody({ type: UpdateMovieDto })
    @ApiResponse({
        status: 200,
        description: 'Movie updated successfully'
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Movie not found' })
    @Post('update/:movieTitle')
    update(
        @Param('movieTitle') movieTitle: string,
        @Body() updateMovieDto: UpdateMovieDto,
    ): Promise<void> {
        return this.moviesService.update(movieTitle, updateMovieDto);
    }

    @ApiOperation({ summary: 'Delete a movie' })
    @ApiParam({ name: 'movieTitle', description: 'The title of the movie to delete' })
    @ApiResponse({
        status: 200,
        description: 'Movie deleted successfully'
    })
    @ApiNotFoundResponse({ description: 'Movie not found' })
    @Delete(':movieTitle')
    @HttpCode(HttpStatus.OK)
    delete(@Param('movieTitle') movieTitle: string): Promise<void> {
        return this.moviesService.delete(movieTitle);
    }
}