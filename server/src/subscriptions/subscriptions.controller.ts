
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionOrderDto } from './dto/create-subscription-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get('plans')
    async getPlans() {
        return this.subscriptionsService.getAllPlans();
    }

    @Post('create-order')
    async createOrder(@Request() req, @Body() createOrderDto: CreateSubscriptionOrderDto) {
        return this.subscriptionsService.createOrder(req.user.userId, createOrderDto);
    }

    @Post('verify')
    async verifyPayment(@Request() req, @Body() verifyPaymentDto: VerifyPaymentDto) {
        return this.subscriptionsService.verifyPayment(req.user.userId, verifyPaymentDto);
    }

    @Get('current')
    async getCurrentSubscription(@Request() req) {
        const sub = await this.subscriptionsService.getActiveSubscription(req.user.userId);
        return {
            hasActiveSubscription: !!sub,
            subscription: sub
        };
    }
}
