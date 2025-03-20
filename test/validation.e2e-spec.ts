// test/validation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Validation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  it('should reject a request with invalid data', () => {
    return request(app.getHttpServer())
      .post('/movies')
      .send({
        title: '',
        genre: 'Action',
        duration: -10,
        rating: 15,
        releaseYear: 1800,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('message');
        const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
        expect(messages.some(msg => msg.includes('title should not be empty'))).toBeTruthy();
        expect(messages.some(msg => msg.includes('duration must not be less than 1'))).toBeTruthy();
        expect(messages.some(msg => msg.includes('rating must not be greater than 10'))).toBeTruthy();
        expect(messages.some(msg => msg.includes('releaseYear must not be less than 1888'))).toBeTruthy();
      });
  });

  it('should reject a request with extra properties', () => {
    return request(app.getHttpServer())
      .post('/movies')
      .send({
        title: 'Valid Movie',
        genre: 'Action',
        duration: 120,
        rating: 8.5,
        releaseYear: 2023,
        extraProperty: 'This should be rejected',
      })
      .expect(400)
      .expect((res) => {
        const messages = Array.isArray(res.body.message) ? res.body.message : [res.body.message];
        expect(messages.some(msg => msg.includes('property extraProperty should not exist'))).toBeTruthy();
      });
  });

  afterEach(async () => {
    // Delete test movie if it was created
    try {
      await request(app.getHttpServer())
        .delete('/movies/Valid Movie')
        .send();
    } catch (e) {
      // Ignore errors
    }

    await app.close();
  });
});