// src/showtimes/showtimes.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { MoviesService } from '../movies/movies.service';

@Injectable()
export class ShowtimesService {
    constructor(
        @InjectRepository(Showtime)
        private showtimesRepository: Repository<Showtime>,
        private errorHandlerService: ErrorHandlerService,
        private moviesService: MoviesService,
    ) { }

    async findById(id: number): Promise<Showtime> {
        try {
            const showtime = await this.showtimesRepository.findOne({ where: { id } });

            if (!showtime) {
                throw new NotFoundException(`Showtime with ID ${id} not found`);
            }

            return showtime;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'findById showtime');
        }
    }

    async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
        try {
            // Check if the movie exists
            await this.validateMovieExists(createShowtimeDto.movieId);

            // Format dates from strings to Date objects
            const startTime = new Date(createShowtimeDto.startTime);
            const endTime = new Date(createShowtimeDto.endTime);

            // Check for overlapping showtimes
            await this.checkForOverlappingShowtimes(
                null,
                createShowtimeDto.theater,
                startTime,
                endTime
            );

            // Create and save the new showtime
            const showtime = this.showtimesRepository.create({
                ...createShowtimeDto,
                startTime,
                endTime
            });

            return await this.showtimesRepository.save(showtime);
        } catch (error) {
            // Let NotFoundException and ConflictException pass through
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'create showtime');
        }
    }

    async update(id: number, updateShowtimeDto: UpdateShowtimeDto): Promise<void> {
        try {
            // Check if the showtime exists
            const showtime = await this.findById(id);

            // Check if movie exists if movieId is provided
            if (updateShowtimeDto.movieId) {
                await this.validateMovieExists(updateShowtimeDto.movieId);
            }

            // Format the dates if provided
            let startTime = showtime.startTime;
            let endTime = showtime.endTime;

            if (updateShowtimeDto.startTime) {
                startTime = new Date(updateShowtimeDto.startTime);
            }

            if (updateShowtimeDto.endTime) {
                endTime = new Date(updateShowtimeDto.endTime);
            }

            // Check that start time is before end time (in case only one is updated)
            if (startTime >= endTime) {
                throw new ConflictException('Start time must be before end time');
            }

            // Check if the theater is changing
            const theater = updateShowtimeDto.theater || showtime.theater;

            // Check for overlapping showtimes (if time or theater changes)
            if (updateShowtimeDto.startTime || updateShowtimeDto.endTime || updateShowtimeDto.theater) {
                await this.checkForOverlappingShowtimes(id, theater, startTime, endTime);
            }

            // Update the showtime
            Object.assign(showtime, {
                ...updateShowtimeDto,
                startTime: startTime,
                endTime: endTime
            });

            await this.showtimesRepository.save(showtime);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'update showtime');
        }
    }

    async delete(id: number): Promise<void> {
        try {
            const result = await this.showtimesRepository.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(`Showtime with ID ${id} not found`);
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(error, 'delete showtime');
        }
    }

    private async validateMovieExists(movieId: number): Promise<void> {
        try {
            // This will throw NotFoundException if movie not found
            const movies = await this.moviesService.findAll();
            const movieExists = movies.some(movie => movie.id === movieId);

            if (!movieExists) {
                throw new NotFoundException(`Movie with ID ${movieId} not found`);
            }
        } catch (error) {
            // If the error is already a NotFoundException, rethrow it
            if (error instanceof NotFoundException) {
                throw error;
            }
            // Otherwise, handle the database error
            this.errorHandlerService.handleDatabaseError(
                error,
                'validating movie existence'
            );
        }
    }

    private async checkForOverlappingShowtimes(
        currentShowtimeId: number | null,
        theater: string,
        startTime: Date,
        endTime: Date
    ): Promise<void> {
        try {
            let overlappingShowtimes: Showtime[] = [];

            if (currentShowtimeId === null) {
                // CREATE operation - check conflicts with any existing showtime
                overlappingShowtimes = await this.showtimesRepository
                    .createQueryBuilder('showtime')
                    .where('showtime.theater = :theater', { theater })
                    .andWhere(
                        `(
                            -- Check if there's any overlap
                            (showtime.start_time < :endTime AND showtime.end_time > :startTime)
                        )`,
                        { startTime, endTime }
                    )
                    .getMany();
            } else {
                // UPDATE operation - exclude the current showtime from check
                overlappingShowtimes = await this.showtimesRepository
                    .createQueryBuilder('showtime')
                    .where('showtime.theater = :theater', { theater })
                    .andWhere('showtime.id != :id', { id: currentShowtimeId })
                    .andWhere(
                        `(
                            -- Check if there's any overlap
                            (showtime.start_time < :endTime AND showtime.end_time > :startTime)
                        )`,
                        { startTime, endTime }
                    )
                    .getMany();
            }

            if (overlappingShowtimes.length > 0) {
                // Get details of conflicting showtimes for better error message
                const conflictTimes = overlappingShowtimes.map(s =>
                    `ID: ${s.id}, Movie: ${s.movieId}, Time: ${s.startTime.toISOString()} - ${s.endTime.toISOString()}`
                ).join('; ');

                throw new ConflictException(
                    `Showtime conflicts with existing showtime(s) in ${theater}. Conflicts: ${conflictTimes}`
                );
            }
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            this.errorHandlerService.handleDatabaseError(
                error,
                'checking for overlapping showtimes'
            );
        }
    }
}