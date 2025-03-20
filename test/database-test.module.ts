// test/database-test.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../src/movies/entities/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [Movie], // Explicitly register the Movie entity
      synchronize: true,
    }),
  ],
})
export class DatabaseTestModule {}