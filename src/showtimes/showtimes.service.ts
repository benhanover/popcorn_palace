// src/showtimes/showtimes.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { MoviesService } from '../movies/movies.service';

@Injectable()
export class ShowtimesService {
    private readonly logger = new Logger(ShowtimesService.name);

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

            this.logger.log(`Creating showtime: movieId=${createShowtimeDto.movieId}, theater=${createShowtimeDto.theater}, startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}`);

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

            const savedShowtime = await this.showtimesRepository.save(showtime);
            this.logger.log(`Showtime created with ID: ${savedShowtime.id}`);
            return savedShowtime;
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

            this.logger.log(`Updating showtime ID ${id}: theater=${theater}, startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}`);

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
            this.logger.log(`Showtime ID ${id} updated successfully`);
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

            this.logger.log(`Showtime ID ${id} deleted successfully`);
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

    /**
     * Entry point for checking overlapping showtimes.
     * Delegates to specialized methods for create or update operations.
     */
    private async checkForOverlappingShowtimes(
        currentShowtimeId: number | null,
        theater: string,
        startTime: Date,
        endTime: Date
    ): Promise<void> {
        if (currentShowtimeId === null) {
            // CREATE operation
            await this.checkForOverlappingShowtimesCreate(theater, startTime, endTime);
        } else {
            // UPDATE operation
            await this.checkForOverlappingShowtimesUpdate(currentShowtimeId, theater, startTime, endTime);
        }
    }

    /**
     * Checks for overlapping showtimes when creating a new showtime.
     * Uses raw SQL for more precise control over the query.
     */
    private async checkForOverlappingShowtimesCreate(
        theater: string,
        startTime: Date,
        endTime: Date
    ): Promise<void> {
        this.logger.log(`Checking for overlaps on CREATE: theater=${theater}, startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}`);

        try {
            // Convert dates to ISO strings for consistent comparison
            const startTimeStr = startTime.toISOString();
            const endTimeStr = endTime.toISOString();

            // Use raw SQL for consistent behavior
            const rawQuery = `
                SELECT id, movie_id, theater, start_time, end_time, price
                FROM showtime
                WHERE theater = $1
                  AND (
                    -- Existing showtime overlaps with new showtime
                    (start_time < $3 AND end_time > $2)
                  )
            `;

            this.logger.debug(`Raw SQL query: ${rawQuery}`);
            this.logger.debug(`Query params: $1=${theater}, $2=${startTimeStr}, $3=${endTimeStr}`);

            const overlappingShowtimes = await this.showtimesRepository.query(
                rawQuery,
                [theater, startTimeStr, endTimeStr]
            );

            this.logger.debug(`Found ${overlappingShowtimes.length} overlapping showtimes`);

            if (overlappingShowtimes.length > 0) {
                // Format the overlapping showtimes for error message
                const conflictTimes = overlappingShowtimes.map(s =>
                    `ID: ${s.id}, Movie: ${s.movie_id}, Time: ${new Date(s.start_time).toISOString()} - ${new Date(s.end_time).toISOString()}`
                ).join('; ');

                this.logger.warn(`Showtime conflict detected: ${conflictTimes}`);
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
                'checking for overlapping showtimes (create)'
            );
        }
    }

    /**
     * Checks for overlapping showtimes when updating an existing showtime.
     * Uses raw SQL for more precise control over the query.
     */
    private async checkForOverlappingShowtimesUpdate(
        currentShowtimeId: number,
        theater: string,
        startTime: Date,
        endTime: Date
    ): Promise<void> {
        this.logger.log(`Checking for overlaps on UPDATE: id=${currentShowtimeId}, theater=${theater}, startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}`);

        try {
            // Convert dates to ISO strings for consistent comparison
            const startTimeStr = startTime.toISOString();
            const endTimeStr = endTime.toISOString();

            // Use raw SQL for consistent behavior, excluding the current showtime
            const rawQuery = `
                SELECT id, movie_id, theater, start_time, end_time, price
                FROM showtime
                WHERE theater = $1
                  AND id != $2
                  AND (
                    -- Existing showtime overlaps with updated showtime
                    (start_time < $4 AND end_time > $3)
                  )
            `;

            this.logger.debug(`Raw SQL query: ${rawQuery}`);
            this.logger.debug(`Query params: $1=${theater}, $2=${currentShowtimeId}, $3=${startTimeStr}, $4=${endTimeStr}`);

            const overlappingShowtimes = await this.showtimesRepository.query(
                rawQuery,
                [theater, currentShowtimeId, startTimeStr, endTimeStr]
            );

            this.logger.debug(`Found ${overlappingShowtimes.length} overlapping showtimes`);

            if (overlappingShowtimes.length > 0) {
                // Format the overlapping showtimes for error message
                const conflictTimes = overlappingShowtimes.map(s =>
                    `ID: ${s.id}, Movie: ${s.movie_id}, Time: ${new Date(s.start_time).toISOString()} - ${new Date(s.end_time).toISOString()}`
                ).join('; ');

                this.logger.warn(`Showtime conflict detected: ${conflictTimes}`);
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
                'checking for overlapping showtimes (update)'
            );
        }
    }
}