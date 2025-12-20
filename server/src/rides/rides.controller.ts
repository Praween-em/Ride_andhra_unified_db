import { Controller, Get, Post, Body, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import { Ride } from './entities/ride.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createRideDto: CreateRideDto, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.create(createRideDto, userId);
  }

  @Post('fare')
  getFare(
    @Body()
    body: { distance: number; duration: number; vehicleType: string },
  ) {
    if (!body.distance || !body.vehicleType) {
      throw new Error('Missing distance or vehicleType');
    }
    return this.ridesService.calculateFare(
      body.distance, // Ensure this assumes meters if service expects km, check service
      body.duration,
      body.vehicleType,
    );
  }

  @Post('fare-estimate')
  async getFareEstimates(
    @Body() body: { distance: number; duration: number }
  ) {
    if (!body.distance) {
      throw new Error('Missing distance');
    }
    // Assume distance is in km or handle conversion if consistent with other endpoints
    return this.ridesService.getFareEstimates(body.distance, body.duration || 0);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Ride[]> {
    return this.ridesService.findAll();
  }

  // IMPORTANT: Specific routes must come BEFORE parameterized routes
  @UseGuards(JwtAuthGuard)
  @Get('current')
  async getCurrentRide(@Req() req): Promise<Ride | null> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.getCurrentRide(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async getPendingRides(@Req() req): Promise<Ride[]> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.getPendingRidesForDriver(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-rides')
  async getMyRides(@Req() req): Promise<Ride[]> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.getMyRides(userId);
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Ride> {
    return this.ridesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRideDto: UpdateRideDto,
  ): Promise<Ride> {
    return this.ridesService.update(id, updateRideDto);
  }



  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async acceptRide(@Param('id') id: string, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.acceptRide(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/decline')
  async declineRide(@Param('id') id: string, @Req() req): Promise<any> {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.ridesService.declineRide(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  async startRide(@Param('id') id: string, @Body('pin') pin: string, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.startRide(id, userId, pin);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  async completeRide(@Param('id') id: string, @Req() req): Promise<Ride> {
    const userId = req.user?.userId || req.user?.id;
    return this.ridesService.completeRide(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelRide(@Param('id') id: string): Promise<any> {
    return this.ridesService.cancelRide(id);
  }

  // Support for legacy/rider app which might use PATCH for accept
  @UseGuards(JwtAuthGuard)
  @Patch(':id/accept')
  async acceptRidePatch(@Param('id') id: string, @Req() req): Promise<Ride> {
    return this.acceptRide(id, req);
  }
}
