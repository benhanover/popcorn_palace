// src/bookings/bookings.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Repository } from 'typeorm';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { ShowtimesService } from '../showtimes/showtimes.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: MockRepository;
  let showtimesService: ShowtimesService;
  let errorHandlerService: ErrorHandlerService;

  const mockShowtimesService = {
    findById: jest.fn(),
  };

  const mockErrorHandlerService = {
    handleDatabaseError: jest.fn().mockImplementation((error) => {
      throw error;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: createMockRepository(),
        },
        {
          provide: ShowtimesService,
          useValue: mockShowtimesService,
        },
        {
          provide: ErrorHandlerService,
          useValue: mockErrorHandlerService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get<MockRepository>(getRepositoryToken(Booking));
    showtimesService = module.get<ShowtimesService>(ShowtimesService);
    errorHandlerService = module.get<ErrorHandlerService>(ErrorHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      showtimeId: 1,
      seatNumber: 15,
      userId: '84438967-f68f-4fa0-b620-0f08217e76af',
    };

    const savedBooking = {
      bookingId: 'd1a6423b-4469-4b00-8c5f-e3cfc42eacae',
      ...createBookingDto,
      createdAt: new Date(),
    };

    it('should create a booking when showtime exists and seat is available', async () => {
      // Mock showtime existence check
      mockShowtimesService.findById.mockResolvedValue({
        id: 1,
        title: 'Test Showtime',
      });

      // Mock seat availability check (no existing booking found)
      bookingRepository.findOne.mockResolvedValue(null);

      // Mock booking creation
      bookingRepository.create.mockReturnValue(savedBooking);
      bookingRepository.save.mockResolvedValue(savedBooking);

      const result = await service.create(createBookingDto);

      expect(mockShowtimesService.findById).toHaveBeenCalledWith(createBookingDto.showtimeId);
      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: {
          showtimeId: createBookingDto.showtimeId,
          seatNumber: createBookingDto.seatNumber,
        },
      });
      expect(bookingRepository.create).toHaveBeenCalledWith(createBookingDto);
      expect(bookingRepository.save).toHaveBeenCalledWith(savedBooking);
      expect(result).toEqual({ bookingId: savedBooking.bookingId });
    });

    it('should throw NotFoundException when showtime does not exist', async () => {
      // Mock showtime not found
      mockShowtimesService.findById.mockRejectedValue(
        new NotFoundException('Showtime not found')
      );

      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
      expect(mockShowtimesService.findById).toHaveBeenCalledWith(createBookingDto.showtimeId);
      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when seat is already booked', async () => {
      // Mock showtime existence check
      mockShowtimesService.findById.mockResolvedValue({
        id: 1,
        title: 'Test Showtime',
      });

      // Mock seat already booked
      bookingRepository.findOne.mockResolvedValue({
        bookingId: 'existing-id',
        showtimeId: 1,
        seatNumber: 15,
        userId: 'another-user',
      });

      await expect(service.create(createBookingDto)).rejects.toThrow(ConflictException);
      expect(mockShowtimesService.findById).toHaveBeenCalledWith(createBookingDto.showtimeId);
      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: {
          showtimeId: createBookingDto.showtimeId,
          seatNumber: createBookingDto.seatNumber,
        },
      });
      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors via error handler', async () => {
      const dbError = new Error('Database connection failed');

      // Mock showtime existence check
      mockShowtimesService.findById.mockResolvedValue({
        id: 1,
        title: 'Test Showtime',
      });

      // Mock database error during seat availability check
      bookingRepository.findOne.mockRejectedValue(dbError);

      await expect(service.create(createBookingDto)).rejects.toThrow();
      expect(errorHandlerService.handleDatabaseError).toHaveBeenCalledWith(
        dbError,
        'checking seat availability'
      );
    });
  });
});