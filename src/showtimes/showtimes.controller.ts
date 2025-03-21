// src/showtimes/showtimes.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    ParseIntPipe
} from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Showtime } from './entities/showtime.entity';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiConflictResponse
} from '@nestjs/swagger';

@ApiTags('showtimes')
@Controller('showtimes')
export class ShowtimesController {
    constructor(private readonly showtimesService: ShowtimesService) {}

    @ApiOperation({ summary: 'Get showtime by ID' })
    @ApiParam({ name: 'showtimeId', description: 'The ID of the showtime to retrieve' })
    @ApiResponse({
        status: 200,
        description: 'Returns the showtime',
        type: Showtime
    })
    @ApiNotFoundResponse({ description: 'Showtime not found' })
    @Get(':showtimeId')
    findOne(@Param('showtimeId', ParseIntPipe) id: number): Promise<Showtime> {
        return this.showtimesService.findById(id);
    }

    @ApiOperation({ summary: 'Create a new showtime' })
    @ApiBody({ type: CreateShowtimeDto })
    @ApiResponse({
        status: 200,
        description: 'Showtime created successfully',
        type: Showtime
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Showtime conflicts with existing showtime(s)' })
    @ApiNotFoundResponse({ description: 'Referenced movie not found' })
    @Post()
    @HttpCode(HttpStatus.OK)
    create(@Body() createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
        return this.showtimesService.create(createShowtimeDto);
    }

    @ApiOperation({ summary: 'Update an existing showtime' })
    @ApiParam({ name: 'showtimeId', description: 'The ID of the showtime to update' })
    @ApiBody({ type: UpdateShowtimeDto })
    @ApiResponse({
        status: 200,
        description: 'Showtime updated successfully'
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiNotFoundResponse({ description: 'Showtime or referenced movie not found' })
    @ApiConflictResponse({ description: 'Showtime conflicts with existing showtime(s)' })
    @Post('update/:showtimeId')
    @HttpCode(HttpStatus.OK)
    update(
        @Param('showtimeId', ParseIntPipe) id: number,
        @Body() updateShowtimeDto: UpdateShowtimeDto,
    ): Promise<void> {
        return this.showtimesService.update(id, updateShowtimeDto);
    }

    @ApiOperation({ summary: 'Delete a showtime' })
    @ApiParam({ name: 'showtimeId', description: 'The ID of the showtime to delete' })
    @ApiResponse({
        status: 200,
        description: 'Showtime deleted successfully'
    })
    @ApiNotFoundResponse({ description: 'Showtime not found' })
    @Delete(':showtimeId')
    @HttpCode(HttpStatus.OK)
    delete(@Param('showtimeId', ParseIntPipe) id: number): Promise<void> {
        return this.showtimesService.delete(id);
    }
}