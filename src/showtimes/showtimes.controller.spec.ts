// src/showtimes/showtimes.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesService } from './showtimes.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Showtime } from './entities/showtime.entity';

describe('ShowtimesController', () => {
  let controller: ShowtimesController;
  let service: ShowtimesService;

  const mockShowtimesService = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowtimesController],
      providers: [
        {
          provide: ShowtimesService,
          useValue: mockShowtimesService,
        },
      ],
    }).compile();

    controller = module.get<ShowtimesController>(ShowtimesController);
    service = module.get<ShowtimesService>(ShowtimesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a showtime by id', async () => {
      const mockShowtime: Showtime = {
        id: 1,
        movieId: 1,
        price: 50.2,
        theater: 'Sample Theater',
        startTime: new Date('2025-02-14T11:47:46.125Z'),
        endTime: new Date('2025-02-14T14:47:46.125Z'),
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockShowtime);

      expect(await controller.findOne(1)).toBe(mockShowtime);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('should pass through NotFoundException', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(
        new NotFoundException('Showtime not found')
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(service.findById).toHaveBeenCalledWith(999);
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

    const mockShowtime: Showtime = {
      id: 1,
      ...createShowtimeDto,
      startTime: new Date(createShowtimeDto.startTime),
      endTime: new Date(createShowtimeDto.endTime),
    };

    it('should create a showtime', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockShowtime);

      expect(await controller.create(createShowtimeDto)).toBe(mockShowtime);
      expect(service.create).toHaveBeenCalledWith(createShowtimeDto);
    });

    it('should pass through NotFoundException', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(
        new NotFoundException('Movie not found')
      );

      await expect(controller.create(createShowtimeDto)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith(createShowtimeDto);
    });

    it('should pass through ConflictException', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(
        new ConflictException('Showtime conflicts with existing showtime(s)')
      );

      await expect(controller.create(createShowtimeDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createShowtimeDto);
    });
  });

  describe('update', () => {
    const updateShowtimeDto: UpdateShowtimeDto = {
      price: 60.0,
    };

    it('should update a showtime', async () => {
      jest.spyOn(service, 'update').mockResolvedValue(undefined);

      await controller.update(1, updateShowtimeDto);

      expect(service.update).toHaveBeenCalledWith(1, updateShowtimeDto);
    });

    it('should pass through NotFoundException', async () => {
      jest.spyOn(service, 'update').mockRejectedValue(
        new NotFoundException('Showtime not found')
      );

      await expect(controller.update(999, updateShowtimeDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(999, updateShowtimeDto);
    });

    it('should pass through ConflictException', async () => {
      const updateWithNewTime: UpdateShowtimeDto = {
        startTime: '2025-02-14T14:30:00.000Z',
        endTime: '2025-02-14T16:30:00.000Z',
      };

      jest.spyOn(service, 'update').mockRejectedValue(
        new ConflictException('Showtime conflicts with existing showtime(s)')
      );

      await expect(controller.update(1, updateWithNewTime)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(1, updateWithNewTime);
    });
  });

  describe('delete', () => {
    it('should delete a showtime', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(undefined);

      await controller.delete(1);

      expect(service.delete).toHaveBeenCalledWith(1);
    });

    it('should pass through NotFoundException', async () => {
      jest.spyOn(service, 'delete').mockRejectedValue(
        new NotFoundException('Showtime not found')
      );

      await expect(controller.delete(999)).rejects.toThrow(NotFoundException);
      expect(service.delete).toHaveBeenCalledWith(999);
    });
  });
});