// src/showtimes/showtimes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ShowtimesService } from './showtimes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Showtime } from './entities/showtime.entity';
import { Repository } from 'typeorm';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { MoviesService } from '../movies/movies.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  // Add the query method that was missing
  query: jest.fn().mockResolvedValue([]),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('ShowtimesService', () => {
  let service: ShowtimesService;
  let showtimeRepository: MockRepository;
  let moviesService: MoviesService;
  let errorHandlerService: ErrorHandlerService;

  const mockMoviesService = {
    findAll: jest.fn(),
  };

  const mockErrorHandlerService = {
    handleDatabaseError: jest.fn().mockImplementation((error) => {
      throw error;
    }),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowtimesService,
        {
          provide: getRepositoryToken(Showtime),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            // Add the query method that was missing
            query: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
        {
          provide: ErrorHandlerService,
          useValue: mockErrorHandlerService,
        },
      ],
    }).compile();

    service = module.get<ShowtimesService>(ShowtimesService);
    showtimeRepository = module.get<MockRepository>(getRepositoryToken(Showtime));
    moviesService = module.get<MoviesService>(MoviesService);
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a showtime when found', async () => {
      const mockShowtime = {
        id: 1,
        movieId: 1,
        price: 50.2,
        theater: 'Sample Theater',
        startTime: new Date('2025-02-14T11:47:46.125Z'),
        endTime: new Date('2025-02-14T14:47:46.125Z'),
      };

      showtimeRepository.findOne.mockResolvedValue(mockShowtime);

      expect(await service.findById(1)).toEqual(mockShowtime);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when showtime is not found', async () => {
      showtimeRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });

    it('should propagate database errors via error handler', async () => {
      const dbError = new Error('Database connection failed');
      showtimeRepository.findOne.mockRejectedValue(dbError);

      await expect(service.findById(1)).rejects.toThrow();
      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(dbError, 'findById showtime');
    });
  });

  describe('create', () => {
    const createShowtimeDto: CreateShowtimeDto = {
      movieId: 1,
      price: 50.2,
      theater: 'Sample Theater',
      startTime: '2025-02-14T11:47:46.125Z',
      endTime: '2025-02-14T14:47:46.125Z',
    };

    const mockShowtime = {
      id: 1,
      ...createShowtimeDto,
      startTime: new Date(createShowtimeDto.startTime),
      endTime: new Date(createShowtimeDto.endTime),
    };

    it('should create a showtime when no conflicts and movie exists', async () => {
      // Mock movie existence check
      mockMoviesService.findAll.mockResolvedValue([{ id: 1, title: 'Test Movie' }]);

      // Mock no overlapping showtimes
      showtimeRepository.query.mockResolvedValue([]);

      // Mock showtime creation
      showtimeRepository.create.mockReturnValue(mockShowtime);
      showtimeRepository.save.mockResolvedValue(mockShowtime);

      const result = await service.create(createShowtimeDto);

      expect(mockMoviesService.findAll).toHaveBeenCalled();
      expect(showtimeRepository.query).toHaveBeenCalled();
      expect(showtimeRepository.create).toHaveBeenCalledWith({
        ...createShowtimeDto,
        startTime: expect.any(Date),
        endTime: expect.any(Date),
      });
      expect(showtimeRepository.save).toHaveBeenCalledWith(mockShowtime);
      expect(result).toEqual(mockShowtime);
    });

    it('should throw NotFoundException when movie does not exist', async () => {
      // Mock movie not found
      mockMoviesService.findAll.mockResolvedValue([{ id: 2, title: 'Different Movie' }]);

      await expect(service.create(createShowtimeDto)).rejects.toThrow(NotFoundException);
      expect(mockMoviesService.findAll).toHaveBeenCalled();
      expect(showtimeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when there are overlapping showtimes', async () => {
      // Mock movie existence check
      mockMoviesService.findAll.mockResolvedValue([{ id: 1, title: 'Test Movie' }]);

      // Mock overlapping showtimes
      const overlappingShowtime = {
        id: 2,
        movie_id: 2,
        theater: 'Sample Theater',
        start_time: new Date('2025-02-14T12:00:00.000Z'),
        end_time: new Date('2025-02-14T14:00:00.000Z'),
        price: 45.0,
      };
      showtimeRepository.query.mockResolvedValue([overlappingShowtime]);

      await expect(service.create(createShowtimeDto)).rejects.toThrow(ConflictException);
      expect(mockMoviesService.findAll).toHaveBeenCalled();
      expect(showtimeRepository.query).toHaveBeenCalled();
      expect(showtimeRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate database errors via error handler', async () => {
      const dbError = new Error('Database connection failed');
      mockMoviesService.findAll.mockRejectedValue(dbError);

      await expect(service.create(createShowtimeDto)).rejects.toThrow();
      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existingShowtime = {
      id: 1,
      movieId: 1,
      price: 50.2,
      theater: 'Sample Theater',
      startTime: new Date('2025-02-14T11:47:46.125Z'),
      endTime: new Date('2025-02-14T14:47:46.125Z'),
    };

    const updateShowtimeDto: UpdateShowtimeDto = {
      price: 60.0,
    };

    it('should update a showtime when no conflicts', async () => {
      // Mock finding the showtime
      showtimeRepository.findOne.mockResolvedValue(existingShowtime);

      // Mock no overlapping showtimes
      showtimeRepository.query.mockResolvedValue([]);

      // Mock successful save
      showtimeRepository.save.mockResolvedValue({
        ...existingShowtime,
        ...updateShowtimeDto,
      });

      await service.update(1, updateShowtimeDto);

      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(showtimeRepository.save).toHaveBeenCalledWith({
        ...existingShowtime,
        ...updateShowtimeDto,
      });
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      // Mock showtime not found
      showtimeRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateShowtimeDto)).rejects.toThrow(NotFoundException);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(showtimeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updated movieId does not exist', async () => {
      // Mock finding the showtime
      showtimeRepository.findOne.mockResolvedValue(existingShowtime);

      // Mock movie not found
      mockMoviesService.findAll.mockResolvedValue([{ id: 2, title: 'Different Movie' }]);

      await expect(service.update(1, { ...updateShowtimeDto, movieId: 3 })).rejects.toThrow(NotFoundException);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockMoviesService.findAll).toHaveBeenCalled();
      expect(showtimeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updated times create conflicts', async () => {
      // Mock finding the showtime
      showtimeRepository.findOne.mockResolvedValue(existingShowtime);

      // Mock overlapping showtimes
      const overlappingShowtime = {
        id: 2,
        movie_id: 2,
        theater: 'Sample Theater',
        start_time: new Date('2025-02-14T15:00:00.000Z'),
        end_time: new Date('2025-02-14T17:00:00.000Z'),
        price: 45.0,
      };
      showtimeRepository.query.mockResolvedValue([overlappingShowtime]);

      const updateWithNewTime: UpdateShowtimeDto = {
        startTime: '2025-02-14T14:30:00.000Z',
        endTime: '2025-02-14T16:30:00.000Z',
      };

      await expect(service.update(1, updateWithNewTime)).rejects.toThrow(ConflictException);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(showtimeRepository.query).toHaveBeenCalled();
      expect(showtimeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when start time is after end time', async () => {
      // Mock finding the showtime
      showtimeRepository.findOne.mockResolvedValue(existingShowtime);

      const updateWithInvalidTimes: UpdateShowtimeDto = {
        startTime: '2025-02-14T16:00:00.000Z',
        endTime: '2025-02-14T14:00:00.000Z', // End time before start time
      };

      await expect(service.update(1, updateWithInvalidTimes)).rejects.toThrow(ConflictException);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(showtimeRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate database errors via error handler', async () => {
      const dbError = new Error('Database connection failed');
      showtimeRepository.findOne.mockRejectedValue(dbError);

      await expect(service.update(1, updateShowtimeDto)).rejects.toThrow();
      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a showtime when it exists', async () => {
      // Mock successful deletion
      showtimeRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(showtimeRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      // Mock showtime not found
      showtimeRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
      expect(showtimeRepository.delete).toHaveBeenCalledWith(999);
    });

    it('should propagate database errors via error handler', async () => {
      const dbError = new Error('Database connection failed');
      showtimeRepository.delete.mockRejectedValue(dbError);

      await expect(service.delete(1)).rejects.toThrow();
      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalled();
    });
  });
});