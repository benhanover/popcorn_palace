// src/movies/movies.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const mockMoviesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const result: Movie[] = [
        {
          id: 1,
          title: 'Test Movie',
          genre: 'Action',
          duration: 120,
          rating: 8.5,
          releaseYear: 2023,
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        genre: 'Comedy',
        duration: 95,
        rating: 7.8,
        releaseYear: 2023,
      };

      const newMovie: Movie = {
        id: 1,
        ...createMovieDto,
      };

      jest.spyOn(service, 'create').mockResolvedValue(newMovie);

      expect(await controller.create(createMovieDto)).toBe(newMovie);
      expect(service.create).toHaveBeenCalledWith(createMovieDto);
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const title = 'Test Movie';
      const updateMovieDto: UpdateMovieDto = { rating: 9.0 };

      jest.spyOn(service, 'update').mockResolvedValue(undefined);

      await controller.update(title, updateMovieDto);
      expect(service.update).toHaveBeenCalledWith(title, updateMovieDto);
    });
  });

  describe('delete', () => {
    it('should delete a movie', async () => {
      const title = 'Test Movie';

      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await controller.delete(title);
      expect(service.delete).toHaveBeenCalledWith(title);
    });
  });
});