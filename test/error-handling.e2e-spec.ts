// test/error-handling.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Error Handling (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  it('should handle 404 errors correctly', () => {
    return request(app.getHttpServer())
      .get('/nonexistent-endpoint')
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 404);
        expect(res.body).toHaveProperty('path', '/nonexistent-endpoint');
        expect(res.body).toHaveProperty('method', 'GET');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('requestId');
      });
  });

  it('should handle 400 errors correctly', () => {
    return request(app.getHttpServer())
      .post('/movies')
      .send({ invalid: 'data' })
      .expect(400)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('path', '/movies');
        expect(res.body).toHaveProperty('method', 'POST');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});