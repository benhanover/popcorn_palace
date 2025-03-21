// src/bookings/bookings.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      showtimeId: 1,
      seatNumber: 15,
      userId: '84438967-f68f-4fa0-b620-0f08217e76af',
    };

    const bookingResponse: BookingResponseDto = {
      bookingId: 'd1a6423b-4469-4b00-8c5f-e3cfc42eacae',
    };

    it('should create a booking', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(bookingResponse);

      expect(await controller.create(createBookingDto)).toBe(bookingResponse);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });

    it('should pass through NotFoundException', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(
        new NotFoundException('Showtime not found')
      );

      await expect(controller.create(createBookingDto)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });

    it('should pass through ConflictException', async () => {
      jest.spyOn(service, 'create').mockRejectedValue(
        new ConflictException('Seat already booked')
      );

      await expect(controller.create(createBookingDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });
  });
});