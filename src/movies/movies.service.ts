import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
    constructor(
        @InjectRepository(Movie)
        private moviesRepository: Repository<Movie>,
    ) { }

    async findAll(): Promise<Movie[]> {
        return this.moviesRepository.find();
    }

    async create(createMovieDto: CreateMovieDto): Promise<Movie> {
        const movie = this.moviesRepository.create(createMovieDto);
        return this.moviesRepository.save(movie);
    }

    async update(title: string, updateMovieDto: UpdateMovieDto): Promise<void> {
        const movie = await this.moviesRepository.findOne({ where: { title } });

        if (!movie) {
            throw new NotFoundException(`Movie with title "${title}" not found`);
        }

        Object.assign(movie, updateMovieDto);
        await this.moviesRepository.save(movie);
    }

    async delete(title: string): Promise<void> {
        const result = await this.moviesRepository.delete({ title });

        if (result.affected === 0) {
            throw new NotFoundException(`Movie with title "${title}" not found`);
        }
    }
}