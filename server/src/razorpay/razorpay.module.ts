import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayService } from './razorpay.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [ProfileModule],
    controllers: [RazorpayController],
    providers: [RazorpayService],
    exports: [RazorpayService],
})
export class RazorpayModule { }
