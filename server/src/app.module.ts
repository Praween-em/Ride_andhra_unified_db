import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RidesModule } from './rides/rides.module';
import { ProfileModule } from './profile/profile.module';
import { DatabaseModule } from './database/database.module';
import { MulterModule } from '@nestjs/platform-express';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { Msg91Module } from './msg91/msg91.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    RidesModule,
    ProfileModule,
    MulterModule.register({
      dest: './uploads',
    }),
    NotificationsModule,
    Msg91Module,
    RazorpayModule,
    SubscriptionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }