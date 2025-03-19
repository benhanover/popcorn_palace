import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from "@nestjs/common"
import { DataSource } from 'typeorm';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  try {
    // Get the DataSource instance
    const dataSource = app.get(DataSource);

    // Test the connection with a simple query
    await dataSource.query('SELECT 1');
    logger.log('✅ Database connection established successfully');
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`, error.stack);
    // You could choose to exit the application here if database is critical
    // process.exit(1);
  }
  await app.listen(process.env.SERVER_PORT);
  logger.log(`Application is running on port ${process.env.SERVER_PORT}`)
}
bootstrap();
