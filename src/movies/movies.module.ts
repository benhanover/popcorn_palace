import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    CommonModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule { }