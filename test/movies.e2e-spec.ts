// test/movies.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../src/movies/entities/movie.entity';
import { MoviesModule } from '../src/movies/movies.module';
import { CommonModule } from '../src/common/common.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('Movies API (e2e)', () => {
  let app: INestApplication;
  let createdMovieId: number;
  const testMovie = {
    title: 'Test Movie',
    genre: 'Action',
    duration: 120,
    rating: 8.5,
    releaseYear: 2023,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Use in-memory SQLite database for testing
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Movie],
          synchronize: true,
        }),
        CommonModule,
        MoviesModule,
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

    // Clean up any test movies that might have been left from previous test runs
    try {
      await request(app.getHttpServer())
        .delete(`/movies/${testMovie.title}`)
        .send();
    } catch (e) {
      // Ignore errors if movie doesn't exist
    }
  });

  describe('POST /movies', () => {
    it('should create a new movie', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .send(testMovie)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(testMovie.title);
          expect(res.body.genre).toBe(testMovie.genre);
          expect(res.body.duration).toBe(testMovie.duration);
          expect(res.body.rating).toBe(testMovie.rating);
          expect(res.body.releaseYear).toBe(testMovie.releaseYear);

          // Store the created movie ID for later tests
          createdMovieId = res.body.id;
        });
    });

    it('should reject duplicate movie titles', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .send(testMovie) // Same movie data as previous test
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          // Update this to match the actual error format from the HttpExceptionFilter
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should reject invalid movie data', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .send({
          title: '', // Empty title - invalid
          genre: 'Drama',
          duration: 0, // Too short - invalid
          rating: 11, // Out of range - invalid
          releaseYear: 1800, // Too early - invalid
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode', 400);
          // The error message format should be an array, so check individual error messages
          const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
          expect(messages.some(msg => msg.includes('title should not be empty'))).toBeTruthy();
          expect(messages.some(msg => msg.includes('duration must not be less than 1'))).toBeTruthy();
          expect(messages.some(msg => msg.includes('rating must not be greater than'))).toBeTruthy();
          expect(messages.some(msg => msg.includes('releaseYear must not be less than'))).toBeTruthy();
        });
    });
  });

  describe('GET /movies/all', () => {
    // Try creating a movie directly to ensure we have something to retrieve
    beforeEach(async () => {
      try {
        await request(app.getHttpServer())
          .post('/movies')
          .send(testMovie)
          .send();
      } catch (e) {
        // Ignore errors
      }
    });

    it('should return all movies including the test movie', () => {
      return request(app.getHttpServer())
        .get('/movies/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const foundMovie = res.body.find(movie => movie.title === testMovie.title);
          expect(foundMovie).toBeDefined();
          // Don't use toBe here as the ID might be different in each test run
          expect(foundMovie.id).toBeDefined();
        });
    });
  });

  describe('POST /movies/update/:movieTitle', () => {
    it('should update an existing movie', () => {
      const updateData = {
        rating: 9.0,
        genre: 'Action/Thriller',
      };

      return request(app.getHttpServer())
        .post(`/movies/update/${testMovie.title}`)
        .send(updateData)
        .expect(200)
        .then(() => {
          // Verify the update worked by getting all movies
          return request(app.getHttpServer())
            .get('/movies/all')
            .expect(200)
            .expect((res) => {
              const updatedMovie = res.body.find(movie => movie.title === testMovie.title);
              expect(updatedMovie).toBeDefined();
              expect(updatedMovie.rating).toBe(updateData.rating);
              expect(updatedMovie.genre).toBe(updateData.genre);
              // Other fields should remain unchanged
              expect(updatedMovie.duration).toBe(testMovie.duration);
              expect(updatedMovie.releaseYear).toBe(testMovie.releaseYear);
            });
        });
    });

    it('should reject updates to non-existent movies', () => {
      return request(app.getHttpServer())
        .post('/movies/update/NonExistentMovie')
        .send({ rating: 9.0 })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  describe('DELETE /movies/:movieTitle', () => {
    it('should delete the test movie', () => {
      return request(app.getHttpServer())
        .delete(`/movies/${testMovie.title}`)
        .expect(200)
        .then(() => {
          // Verify the movie was deleted
          return request(app.getHttpServer())
            .get('/movies/all')
            .expect(200)
            .expect((res) => {
              const deletedMovie = res.body.find(movie => movie.title === testMovie.title);
              expect(deletedMovie).toBeUndefined();
            });
        });
    });

    it('should handle deletion of non-existent movies', () => {
      return request(app.getHttpServer())
        .delete('/movies/NonExistentMovie')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  afterAll(async () => {
    // Clean up - though we already deleted our test movie in the tests
    try {
      await request(app.getHttpServer())
        .delete(`/movies/${testMovie.title}`)
        .send();
    } catch (e) {
      // Ignore errors if movie doesn't exist
    }

    // Close the app (this will also close all connections)
    await app.close();
  });
});