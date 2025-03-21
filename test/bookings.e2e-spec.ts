// test/bookings.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../src/bookings/entities/booking.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { Showtime } from '../src/showtimes/entities/showtime.entity';
import { BookingsModule } from '../src/bookings/bookings.module';
import { MoviesModule } from '../src/movies/movies.module';
import { ShowtimesModule } from '../src/showtimes/showtimes.module';
import { CommonModule } from '../src/common/common.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';

describe('Bookings API (e2e)', () => {
  let app: INestApplication;
  let testMovieId: number;
  let testShowtimeId: number;
  let testUserId: string;

  const testMovie = {
    title: 'E2E Test Movie for Bookings',
    genre: 'Action',
    duration: 120,
    rating: 8.5,
    releaseYear: 2025,
  };

  const testShowtime = {
    movieId: null, // Will be set after creating the test movie
    price: 50.2,
    theater: 'E2E Test Theater for Bookings',
    startTime: '2025-03-21T12:00:00.000Z',
    endTime: '2025-03-21T14:00:00.000Z',
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
          entities: [Movie, Showtime, Booking],
          synchronize: true, // Automatically create tables for testing
          logging: false,
        }),
        CommonModule,
        MoviesModule,
        ShowtimesModule,
        BookingsModule,
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

    // Generate a test user ID
    testUserId = uuidv4();

    // Create a test movie first
    const movieResponse = await request(app.getHttpServer())
      .post('/movies')
      .send(testMovie)
      .expect(200);

    testMovieId = movieResponse.body.id;

    // Create a test showtime
    testShowtime.movieId = testMovieId;
    const showtimeResponse = await request(app.getHttpServer())
      .post('/showtimes')
      .send(testShowtime)
      .expect(200);

    testShowtimeId = showtimeResponse.body.id;
  }, 30000); // Increase timeout to 30 seconds

  describe('POST /bookings', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        showtimeId: testShowtimeId,
        seatNumber: 1,
        userId: testUserId,
      };

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .send(bookingData)
        .expect(200);

      expect(response.body).toHaveProperty('bookingId');
      expect(typeof response.body.bookingId).toBe('string');
    });

    it('should reject booking the same seat twice', async () => {
      const bookingData = {
        showtimeId: testShowtimeId,
        seatNumber: 2, // Use a different seat number
        userId: testUserId,
      };

      // First booking should succeed
      await request(app.getHttpServer())
        .post('/bookings')
        .send(bookingData)
        .expect(200);

      // Second booking for the same seat should fail
      await request(app.getHttpServer())
        .post('/bookings')
        .send(bookingData)
        .expect(409);
    });

    it('should allow booking different seats for the same showtime', async () => {
      const firstBookingData = {
        showtimeId: testShowtimeId,
        seatNumber: 3,
        userId: testUserId,
      };

      const secondBookingData = {
        showtimeId: testShowtimeId,
        seatNumber: 4, // Different seat number
        userId: testUserId,
      };

      // First booking should succeed
      await request(app.getHttpServer())
        .post('/bookings')
        .send(firstBookingData)
        .expect(200);

      // Second booking for a different seat should also succeed
      await request(app.getHttpServer())
        .post('/bookings')
        .send(secondBookingData)
        .expect(200);
    });

    it('should reject booking with invalid input data', async () => {
      const invalidBookingData = {
        showtimeId: testShowtimeId,
        seatNumber: -1, // Invalid seat number
        userId: testUserId,
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .send(invalidBookingData)
        .expect(400);
    });

    it('should reject booking with non-existent showtime', async () => {
      const nonExistentShowtimeBooking = {
        showtimeId: 9999, // Non-existent showtime ID
        seatNumber: 5,
        userId: testUserId,
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .send(nonExistentShowtimeBooking)
        .expect(404);
    });

    it('should reject booking with non-UUID user ID', async () => {
      const invalidUserIdBooking = {
        showtimeId: testShowtimeId,
        seatNumber: 5,
        userId: 'not-a-valid-uuid', // Invalid UUID
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .send(invalidUserIdBooking)
        .expect(400);
    });

    it('should reject booking with extra properties', async () => {
      const bookingWithExtraProps = {
        showtimeId: testShowtimeId,
        seatNumber: 5,
        userId: testUserId,
        extraProperty: 'This should be rejected',
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .send(bookingWithExtraProps)
        .expect(400);
    });
  });

  afterAll(async () => {
    try {
      const dataSource = app.get(DataSource);

      // Clear tables in reverse order to avoid foreign key constraints
      // First, verify that we can access the database
      await dataSource.query('SELECT 1');
      console.log('Database connection confirmed for cleanup');

      // Execute cleanup with detailed logging
      console.log('Starting database cleanup...');

      // Delete bookings
      const bookingResult = await dataSource.query('DELETE FROM booking');
      console.log(`Deleted ${bookingResult[1]} booking records`);

      // Delete showtimes
      const showtimeResult = await dataSource.query('DELETE FROM showtime WHERE id = $1', [testShowtimeId]);
      console.log(`Deleted showtime #${testShowtimeId}: ${showtimeResult[1]} records`);

      // Delete movies
      const movieResult = await dataSource.query('DELETE FROM movie WHERE id = $1', [testMovieId]);
      console.log(`Deleted movie #${testMovieId}: ${movieResult[1]} records`);

      // Verify tables are empty
      const bookingCheck = await dataSource.query('SELECT COUNT(*) FROM booking');
      const showtimeCheck = await dataSource.query('SELECT COUNT(*) FROM showtime WHERE id = $1', [testShowtimeId]);
      const movieCheck = await dataSource.query('SELECT COUNT(*) FROM movie WHERE id = $1', [testMovieId]);

      console.log('Verification counts after cleanup:');
      console.log(`- Bookings: ${bookingCheck[0].count}`);
      console.log(`- Test showtime: ${showtimeCheck[0].count}`);
      console.log(`- Test movie: ${movieCheck[0].count}`);

      if (bookingCheck[0].count > 0 || showtimeCheck[0].count > 0 || movieCheck[0].count > 0) {
        console.warn('Warning: Some test records may not have been properly cleaned up');
      } else {
        console.log('Database cleanup successful');
      }
    } catch (e) {
      console.error('Error during final cleanup:', e.message, e.stack);

      // Even if cleanup fails, still try to close the app
      console.log('Attempting to close application despite cleanup error');
    } finally {
      // Close the app (this will also close all connections)
      await app.close();
      console.log('Application closed');
    }
  }, 20000); // Increase timeout to 20 seconds for thorough cleanup
});