import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class MoviesService {
    constructor(
        @InjectRepository(Movie)
        private moviesRepository: Repository<Movie>,
        private errorHandlerService: ErrorHandlerService,
    ) { }

    async findAll(): Promise<Movie[]> {
        try {
            return await this.moviesRepository.find();
        } catch (error) {
            this.errorHandlerService.handleDatabaseError(error, 'findAll movies');
        }
    }

    async create(createMovieDto: CreateMovieDto): Promise<Movie> {
        try {
            // Check if movie with this title already exists
            const existingMovie = await this.moviesRepository.findOne({
                where: { title: createMovieDto.title },
            });

            if (existingMovie) {
                throw new Error(`Movie with title "${createMovieDto.title}" already exists`);
            }

            const movie = this.moviesRepository.create(createMovieDto);
            return await this.moviesRepository.save(movie);
        } catch (error) {
            this.errorHandlerService.handleDatabaseError(error, 'create movie');
        }
    }

    async update(title: string, updateMovieDto: UpdateMovieDto): Promise<void> {
        try {
            const movie = await this.moviesRepository.findOne({ where: { title } });

            if (!movie) {
                throw new NotFoundException(`Movie with title "${title}" not found`);
            }

            Object.assign(movie, updateMovieDto);
            await this.moviesRepository.save(movie);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'update movie');
        }
    }

    async delete(title: string): Promise<void> {
        try {
            const result = await this.moviesRepository.delete({ title });

            if (result.affected === 0) {
                throw new NotFoundException(`Movie with title "${title}" not found`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'delete movie');
        }
    }
}