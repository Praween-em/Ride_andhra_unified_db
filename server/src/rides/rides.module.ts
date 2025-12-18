import { Module, forwardRef } from '@nestjs/common';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride, RideStatus } from './entities/ride.entity';
import { FareSetting, VehicleType } from './entities/fare-setting.entity';
import { RideRejection } from './entities/ride-rejection.entity';
import { Driver } from '../profile/entities/driver.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { DriverSubscription } from '../profile/entities/driver-subscription.entity';
import { FareTier } from './entities/fare-tier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, RideRejection, Driver, FareSetting, DriverSubscription, FareTier]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule { }
