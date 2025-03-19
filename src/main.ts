import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Apply global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Popcorn Palace API')
    .setDescription('Movie ticket booking system API')
    .setVersion('1.0')
    .addTag('movies', 'Movie management endpoints')
    .addTag('showtimes', 'Showtime management endpoints')
    .addTag('bookings', 'Ticket booking endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  try {
    // Get the DataSource instance
    const dataSource = app.get(DataSource);
    // Test the connection with a simple query
    await dataSource.query('SELECT 1');
    logger.log('✅ Database connection established successfully');
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`, error.stack);
  }

  const port = process.env.SERVER_PORT || 3000;
  await app.listen(port);
  logger.log(`✅ Application is running on port ${port}`);
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api`);
}
bootstrap();