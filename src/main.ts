import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

  try {
    // Get the DataSource instance
    const dataSource = app.get(DataSource);
    // Test the connection with a simple query
    await dataSource.query('SELECT 1');
    logger.log('✅ Database connection established successfully');
  } catch (error) {
    // We're still using logger.error here because the error handler service
    // isn't available during bootstrap
    logger.error(`❌ Database connection failed: ${error.message}`, error.stack);

    // Optional: Exit application if database connection is critical
    // process.exit(1);
  }

  await app.listen(process.env.SERVER_PORT || 3000);
  logger.log(`Application is running on port ${process.env.SERVER_PORT || 3000}`);
}
bootstrap();