import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { Driver } from './entities/driver.entity';
import { DriverDocument } from './entities/driver-document.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../auth/entities/user.entity';
import { DriverSubscription } from './entities/driver-subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { RiderProfile } from './entities/rider-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Driver, DriverDocument, Ride, DriverSubscription, SubscriptionPlan, RiderProfile])],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService], // Export ProfileService so other modules can use it
})
export class ProfileModule { }
