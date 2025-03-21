// test/showtimes.e2e-spec.ts
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from '../src/showtimes/entities/showtime.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { ShowtimesModule } from '../src/showtimes/showtimes.module';
import { MoviesModule } from '../src/movies/movies.module';
import { CommonModule } from '../src/common/common.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ConfigModule } from '@nestjs/config';

describe('Showtimes API (e2e)', () => {
  let app: INestApplication;
  let testMovieId: number;
  let createdShowtimeId: number;

  const testMovie = {
    title: 'E2E Test Movie',
    genre: 'Action',
    duration: 120,
    rating: 8.5,
    releaseYear: 2025,
  };

  const testShowtime = {
    movieId: null, // Will be set after creating the test movie
    price: 50.2,
    theater: 'E2E Test Theater',
    startTime: '2025-02-14T12:00:00.000Z',
    endTime: '2025-02-14T14:00:00.000Z',
  };

  const overlappingShowtime = {
    movieId: null, // Will be set after creating the test movie
    price: 45.0,
    theater: 'E2E Test Theater',
    startTime: '2025-02-14T13:00:00.000Z', // Overlaps with testShowtime
    endTime: '2025-02-14T15:00:00.000Z',
  };

  const nonOverlappingShowtime = {
    movieId: null, // Will be set after creating the test movie
    price: 45.0,
    theater: 'E2E Test Theater',
    startTime: '2025-02-14T15:00:00.000Z', // After testShowtime
    endTime: '2025-02-14T17:00:00.000Z',
  };

  const differentTheaterShowtime = {
    movieId: null, // Will be set after creating the test movie
    price: 45.0,
    theater: 'Different Theater', // Different theater, so no overlap
    startTime: '2025-02-14T12:00:00.000Z', // Same time as testShowtime
    endTime: '2025-02-14T14:00:00.000Z',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        // Use the dedicated test PostgreSQL server
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5433'), // Test DB runs on port 5433
          username: process.env.TEST_DB_USERNAME || 'popcorn-palace-test',
          password: process.env.TEST_DB_PASSWORD || 'popcorn-palace-test',
          database: process.env.TEST_DB_NAME || 'popcorn-palace-test',
          entities: [Movie, Showtime],
          synchronize: true, // Automatically create tables for testing
          logging: false,
        }),
        CommonModule,
        MoviesModule,
        ShowtimesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app with the same pipes and filters as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    // Create a test movie first
    const movieResponse = await request(app.getHttpServer())
      .post('/movies')
      .send(testMovie)
      .expect(200);

    testMovieId = movieResponse.body.id;
    testShowtime.movieId = testMovieId;
    overlappingShowtime.movieId = testMovieId;
    nonOverlappingShowtime.movieId = testMovieId;
    differentTheaterShowtime.movieId = testMovieId;
  }, 30000); // Increase timeout to 30 seconds

  describe('POST /showtimes', () => {
    it('should create a new showtime', async () => {
      const response = await request(app.getHttpServer())
        .post('/showtimes')
        .send(testShowtime)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.movieId).toBe(testMovieId);
      expect(response.body.price).toBe(testShowtime.price);
      expect(response.body.theater).toBe(testShowtime.theater);
      expect(new Date(response.body.startTime).toISOString()).toBe(new Date(testShowtime.startTime).toISOString());
      expect(new Date(response.body.endTime).toISOString()).toBe(new Date(testShowtime.endTime).toISOString());

      // Store the created showtime ID for later tests
      createdShowtimeId = response.body.id;
    });

    it('should reject invalid showtime data', async () => {
      const invalidShowtime = {
        movieId: testMovieId,
        price: -10, // Invalid price
        theater: '', // Empty theater
        startTime: 'invalid-date', // Invalid date
        endTime: '2025-02-14T14:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .post('/showtimes')
        .send(invalidShowtime)
        .expect(400);

      expect(response.body.message).toContain('price must be a positive number');
      expect(response.body.message).toContain('theater should not be empty');
      expect(response.body.message).toContain('startTime must be a valid ISO 8601 date string');
    });

    it('should reject showtime with end time before start time', async () => {
      const invalidShowtime = {
        movieId: testMovieId,
        price: 50.2,
        theater: 'E2E Test Theater',
        startTime: '2025-02-14T16:00:00.000Z',
        endTime: '2025-02-14T14:00:00.000Z', // Before start time
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(invalidShowtime)
        .expect(400);
    });

    it('should reject showtime for non-existent movie', async () => {
      const showtimeWithNonExistentMovie = {
        ...testShowtime,
        movieId: 9999, // Non-existent movie ID
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(showtimeWithNonExistentMovie)
        .expect(404);
    });

    it('should reject overlapping showtime in the same theater', async () => {
      await request(app.getHttpServer())
        .post('/showtimes')
        .send(overlappingShowtime)
        .expect(409);
    });

    it('should allow non-overlapping showtime in the same theater', async () => {
      const response = await request(app.getHttpServer())
        .post('/showtimes')
        .send(nonOverlappingShowtime)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.theater).toBe(nonOverlappingShowtime.theater);
    });

    it('should allow showtime at the same time but in a different theater', async () => {
      const response = await request(app.getHttpServer())
        .post('/showtimes')
        .send(differentTheaterShowtime)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.theater).toBe(differentTheaterShowtime.theater);
    });
  });

  describe('GET /showtimes/:showtimeId', () => {
    it('should return the showtime by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}`)
        .expect(200);

      expect(response.body.id).toBe(createdShowtimeId);
      expect(response.body.movieId).toBe(testMovieId);
      expect(response.body.theater).toBe(testShowtime.theater);
    });

    it('should return 404 for non-existent showtime', async () => {
      await request(app.getHttpServer())
        .get('/showtimes/9999')
        .expect(404);
    });

    it('should reject invalid ID format', async () => {
      await request(app.getHttpServer())
        .get('/showtimes/not-a-number')
        .expect(400);
    });
  });

  describe('POST /showtimes/update/:showtimeId', () => {
    it('should update showtime with valid data', async () => {
      const updateData = {
        price: 75.0,
      };

      await request(app.getHttpServer())
        .post(`/showtimes/update/${createdShowtimeId}`)
        .send(updateData)
        .expect(200);

      // Verify the update was successful
      const response = await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}`)
        .expect(200);

      // Compare as numbers by parsing the string to handle PostgreSQL decimal formatting
      expect(parseFloat(response.body.price)).toBe(updateData.price);
      expect(response.body.theater).toBe(testShowtime.theater); // Other fields unchanged
    });

    it('should reject update with invalid data', async () => {
      const invalidUpdateData = {
        price: -10, // Invalid price
      };

      await request(app.getHttpServer())
        .post(`/showtimes/update/${createdShowtimeId}`)
        .send(invalidUpdateData)
        .expect(400);
    });

    it('should reject update that would create time conflict', async () => {
      // Try to change the time to overlap with the non-overlapping showtime we created earlier
      const conflictingUpdateData = {
        startTime: '2025-02-14T16:00:00.000Z', // Overlaps with nonOverlappingShowtime
        endTime: '2025-02-14T18:00:00.000Z',
      };

      await request(app.getHttpServer())
        .post(`/showtimes/update/${createdShowtimeId}`)
        .send(conflictingUpdateData)
        .expect(409);
    });

    it('should allow update that changes theater to avoid conflict', async () => {
      // Change the theater to avoid conflict with the same time
      const theaterUpdateData = {
        theater: 'New Theater',
        startTime: '2025-02-14T15:00:00.000Z', // Same as nonOverlappingShowtime
        endTime: '2025-02-14T17:00:00.000Z',
      };

      await request(app.getHttpServer())
        .post(`/showtimes/update/${createdShowtimeId}`)
        .send(theaterUpdateData)
        .expect(200);

      // Verify the update was successful
      const response = await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}`)
        .expect(200);

      expect(response.body.theater).toBe(theaterUpdateData.theater);
      expect(new Date(response.body.startTime).toISOString()).toBe(new Date(theaterUpdateData.startTime).toISOString());
    });

    it('should reject update for non-existent showtime', async () => {
      await request(app.getHttpServer())
        .post('/showtimes/update/9999')
        .send({ price: 60.0 })
        .expect(404);
    });
  });

  describe('DELETE /showtimes/:showtimeId', () => {
    it('should delete an existing showtime', async () => {
      await request(app.getHttpServer())
        .delete(`/showtimes/${createdShowtimeId}`)
        .expect(200);

      // Verify the showtime was deleted
      await request(app.getHttpServer())
        .get(`/showtimes/${createdShowtimeId}`)
        .expect(404);
    });

    it('should return 404 when deleting a non-existent showtime', async () => {
      await request(app.getHttpServer())
        .delete('/showtimes/9999')
        .expect(404);
    });
  });

  describe('Complex overlapping scenarios', () => {
    let showtime1Id: number;
    let showtime2Id: number;

    // Test data for complex overlapping tests
    const baseTime = new Date('2025-03-01T10:00:00.000Z');
    const complexTheater = 'Complex Test Theater';

    beforeAll(async () => {
      // Create two non-overlapping showtimes for complex tests
      const showtime1 = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime()).toISOString(),
        endTime: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
      };

      const showtime2 = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime() + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
        endTime: new Date(baseTime.getTime() + 5 * 60 * 60 * 1000).toISOString(), // +5 hours
      };

      // Create the first showtime
      const response1 = await request(app.getHttpServer())
        .post('/showtimes')
        .send(showtime1)
        .expect(200);

      showtime1Id = response1.body.id;

      // Create the second showtime
      const response2 = await request(app.getHttpServer())
        .post('/showtimes')
        .send(showtime2)
        .expect(200);

      showtime2Id = response2.body.id;
    }, 15000); // Increase timeout to 15 seconds

    it('should reject new showtime starting during existing showtime', async () => {
      const conflictingShowtime = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000).toISOString(), // +1 hour
        endTime: new Date(baseTime.getTime() + 3.5 * 60 * 60 * 1000).toISOString(), // +3.5 hours
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(conflictingShowtime)
        .expect(409);
    });

    it('should reject new showtime ending during existing showtime', async () => {
      const conflictingShowtime = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime() - 1 * 60 * 60 * 1000).toISOString(), // -1 hour
        endTime: new Date(baseTime.getTime() + 1 * 60 * 60 * 1000).toISOString(), // +1 hour
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(conflictingShowtime)
        .expect(409);
    });

    it('should reject new showtime completely containing existing showtime', async () => {
      const conflictingShowtime = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime() - 1 * 60 * 60 * 1000).toISOString(), // -1 hour
        endTime: new Date(baseTime.getTime() + 6 * 60 * 60 * 1000).toISOString(), // +6 hours
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(conflictingShowtime)
        .expect(409);
    });

    it('should reject new showtime completely within existing showtime', async () => {
      const conflictingShowtime = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime() + 0.5 * 60 * 60 * 1000).toISOString(), // +0.5 hours
        endTime: new Date(baseTime.getTime() + 1.5 * 60 * 60 * 1000).toISOString(), // +1.5 hours
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(conflictingShowtime)
        .expect(409);
    });

    it('should allow new showtime exactly between existing showtimes (tight fit)', async () => {
      const tightFitShowtime = {
        movieId: testMovieId,
        price: 50.0,
        theater: complexTheater,
        startTime: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
        endTime: new Date(baseTime.getTime() + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
      };

      await request(app.getHttpServer())
        .post('/showtimes')
        .send(tightFitShowtime)
        .expect(200);
    });

    afterAll(async () => {
      // Clean up created showtimes
      try {
        await request(app.getHttpServer())
          .delete(`/showtimes/${showtime1Id}`)
          .send();

        await request(app.getHttpServer())
          .delete(`/showtimes/${showtime2Id}`)
          .send();
      } catch (e) {
        console.log('Error cleaning up complex scenario showtimes:', e.message);
      }
    }, 10000); // Add timeout
  });


  afterAll(async () => {
    try {
      const dataSource = app.get(DataSource);

      // Clear tables in reverse order to avoid foreign key constraints
      await dataSource.query('DELETE FROM showtime');
      await dataSource.query('DELETE FROM movie');
    } catch (e) {
      console.error('Error during final cleanup:', e.message);
    }

    // Close the app (this will also close all connections)
    await app.close();
  }, 10000); // Add timeout
});