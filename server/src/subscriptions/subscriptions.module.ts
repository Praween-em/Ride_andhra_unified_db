
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from '../profile/entities/subscription-plan.entity';
import { DriverSubscription } from '../profile/entities/driver-subscription.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([SubscriptionPlan, DriverSubscription]),
        ConfigModule,
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService],
    exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
