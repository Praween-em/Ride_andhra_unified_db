import { Controller, Get, Post, Body, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { Ride } from './entities/ride.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rides')
@UseGuards(JwtAuthGuard) // Protect all routes with JWT authentication
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

  @Post()
  async create(@Body() createRideDto: CreateRideDto): Promise<Ride> {
    return this.ridesService.create(createRideDto);
  }

  @Get()
  async findAll(): Promise<Ride[]> {
    return this.ridesService.findAll();
  }

  // IMPORTANT: Specific routes must come BEFORE parameterized routes
  @Get('current')
  async getCurrentRide(@Req() req): Promise<Ride | null> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.getCurrentRide(userId);
  }

  @Get('pending')
  async getPendingRides(@Req() req): Promise<Ride[]> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.getPendingRidesForDriver(userId);
  }

  @Get('driver-history')
  async getDriverHistory(@Req() req): Promise<Ride[]> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.getDriverRideHistory(userId);
  }

  @Get('high-booking-zones')
  async getHighBookingZones(): Promise<string[]> {
    return this.ridesService.getHighBookingZones();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Ride> {
    return this.ridesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRideDto: UpdateRideDto,
  ): Promise<Ride> {
    return this.ridesService.update(id, updateRideDto);
  }



  @Post(':id/accept')
  async acceptRide(@Param('id') id: string, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.acceptRide(id, userId);
  }

  @Post(':id/decline')
  async declineRide(@Param('id') id: string, @Req() req): Promise<any> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.declineRide(id, userId);
  }

  @Post(':id/start')
  async startRide(@Param('id') id: string, @Body('pin') pin: string, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.startRide(id, userId, pin);
  }

  @Post(':id/complete')
  async completeRide(@Param('id') id: string, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.completeRide(id, userId);
  }
}
