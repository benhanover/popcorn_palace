// src/movies/movies.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { NotFoundException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepository: MockRepository;
  let errorHandlerService: ErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: createMockRepository(),
        },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleDatabaseError: jest.fn().mockImplementation((error) => {
              throw error;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    movieRepository = module.get<MockRepository>(getRepositoryToken(Movie));
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const expectedMovies = [
        {
          id: 1,
          title: 'Test Movie',
          genre: 'Action',
          duration: 120,
          rating: 8.5,
          releaseYear: 2023,
        },
      ];
      movieRepository.find.mockResolvedValue(expectedMovies);

      const movies = await service.findAll();
      expect(movies).toEqual(expectedMovies);
      expect(movieRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should handle errors through error service', async () => {
      const error = new Error('Database error');
      movieRepository.find.mockRejectedValue(error);

      try {
        await service.findAll();
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('create', () => {
    it('should create and return a movie', async () => {
      const createMovieDto = {
        title: 'New Movie',
        genre: 'Comedy',
        duration: 95,
        rating: 7.8,
        releaseYear: 2023,
      };

      const newMovie = { id: 1, ...createMovieDto };

      movieRepository.findOne.mockResolvedValue(null);
      movieRepository.create.mockReturnValue(newMovie);
      movieRepository.save.mockResolvedValue(newMovie);

      const result = await service.create(createMovieDto);

      expect(result).toEqual(newMovie);
      expect(movieRepository.create).toHaveBeenCalledWith(createMovieDto);
      expect(movieRepository.save).toHaveBeenCalledWith(newMovie);
    });

    it('should throw error if movie with same title exists', async () => {
      const createMovieDto = {
        title: 'Existing Movie',
        genre: 'Drama',
        duration: 120,
        rating: 9.0,
        releaseYear: 2022,
      };

      movieRepository.findOne.mockResolvedValue({ id: 1, ...createMovieDto });

      await expect(service.create(createMovieDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const title = 'Existing Movie';
      const updateMovieDto = { rating: 9.5 };
      const existingMovie = {
        id: 1,
        title,
        genre: 'Drama',
        duration: 120,
        rating: 9.0,
        releaseYear: 2022,
      };

      movieRepository.findOne.mockResolvedValue(existingMovie);
      movieRepository.save.mockResolvedValue({ ...existingMovie, ...updateMovieDto });

      await service.update(title, updateMovieDto);

      expect(movieRepository.findOne).toHaveBeenCalledWith({ where: { title } });
      expect(movieRepository.save).toHaveBeenCalledWith({ ...existingMovie, ...updateMovieDto });
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const title = 'Nonexistent Movie';
      const updateMovieDto = { rating: 9.5 };

      movieRepository.findOne.mockResolvedValue(null);

      await expect(service.update(title, updateMovieDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a movie', async () => {
      const title = 'Movie to Delete';
      movieRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(title);

      expect(movieRepository.delete).toHaveBeenCalledWith({ title });
    });

    it('should throw NotFoundException if movie does not exist', async () => {
      const title = 'Nonexistent Movie';
      movieRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.delete(title))
        .rejects.toThrow(NotFoundException);
    });
  });
});