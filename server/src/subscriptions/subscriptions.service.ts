
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

import { SubscriptionPlan } from '../profile/entities/subscription-plan.entity';
import { DriverSubscription } from '../profile/entities/driver-subscription.entity';
import { CreateSubscriptionOrderDto } from './dto/create-subscription-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class SubscriptionsService {
    private razorpay: Razorpay;

    constructor(
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
        @InjectRepository(DriverSubscription)
        private readonly subscriptionRepository: Repository<DriverSubscription>,
        private readonly configService: ConfigService,
    ) {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        console.log('SubscriptionsService init: Razorpay Key ID present:', !!keyId);
        console.log('SubscriptionsService init: Razorpay Key Secret present:', !!keySecret);

        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    async getAllPlans() {
        return this.planRepository.find({
            where: { isActive: true },
            order: { price: 'ASC' },
        });
    }

    async createOrder(driverId: string, createOrderDto: CreateSubscriptionOrderDto) {
        const { planId } = createOrderDto;

        const plan = await this.planRepository.findOne({ where: { id: planId } });
        if (!plan) {
            throw new NotFoundException('Subscription plan not found');
        }

        try {
            console.log(`Creating order for Plan: ${plan.name}, Price: ${plan.price}`);

            // Ensure Key ID satisfies Razorpay requirements (check if loaded)
            const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
            if (!keyId) {
                console.error('RAZORPAY_KEY_ID is missing in configuration');
            }

            const GST_RATE = 0.18;
            const price = Number(plan.price);
            const amountWithTax = Math.round(price * (1 + GST_RATE) * 100);

            console.log(`Calculated Amount (Paise): ${amountWithTax}`);

            const options = {
                amount: amountWithTax, // Amount in smallest currency unit (paise) inclusive of 18% GST
                currency: 'INR',
                receipt: `receipt_${driverId.substring(0, 8)}_${Date.now()}`,
                notes: {
                    driverId: driverId,
                    planId: planId,
                },
            };

            console.log('Razorpay Order Options:', JSON.stringify(options, null, 2));
            const order = await this.razorpay.orders.create(options);
            console.log('Razorpay Order Created:', order.id);

            return {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: this.configService.get<string>('RAZORPAY_KEY_ID'), // Send key to frontend
                planName: plan.name,
                planDescription: plan.description,
            };
        } catch (error) {
            console.error('Error creating Razorpay order:');
            console.error(error); // Log the full error object directly

            if (error.statusCode) {
                console.error('Razorpay Status Code:', error.statusCode);
                console.error('Razorpay Error Description:', error.error?.description);
                console.error('Razorpay Error Metadata:', error.error?.metadata);
            }

            throw new InternalServerErrorException(`Failed to create payment order: ${error.error?.description || error.message || 'Unknown error'}`);
        }
    }

    async verifyPayment(driverId: string, verifyPaymentDto: VerifyPaymentDto) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = verifyPaymentDto;

        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
        if (!secret) {
            throw new InternalServerErrorException('Payment configuration missing on server');
        }

        // 1. Verify Signature
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new BadRequestException('Invalid payment signature');
        }

        // 2. Payment is valid. Activate Subscription.
        const plan = await this.planRepository.findOne({ where: { id: planId } });
        if (!plan) {
            throw new NotFoundException('Plan not found');
        }

        // Check if there is an existing active subscription to extend?
        // For now, we will just create a new one starting NOW. 
        // If we wanted to queue them, we would check for max(endDate) of current active subs.

        // Let's implement simple "start now" logic. If they have one active, it might overlap.
        // Ideally, we should check for an active one and extend it.

        const activeSub = await this.subscriptionRepository.findOne({
            where: {
                driverId,
                status: 'active'
            },
            order: { endDate: 'DESC' } // Get the one ending latest
        });

        let startDate = new Date();
        if (activeSub && activeSub.endDate > new Date()) {
            // If they already have an active sub, start the new one after the current one ends
            startDate = new Date(activeSub.endDate);
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationDays);

        const newSubscription = this.subscriptionRepository.create({
            driverId,
            planId: plan.id,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            isPaid: true,
            razorpayPaymentId: razorpay_payment_id,
            autoRenew: false, // Default to false for now
        });

        await this.subscriptionRepository.save(newSubscription);

        return {
            message: 'Subscription activated successfully',
            subscription: {
                id: newSubscription.id,
                planName: plan.name,
                startDate: newSubscription.startDate,
                endDate: newSubscription.endDate,
                status: newSubscription.status
            }
        };
    }

    async getActiveSubscription(driverId: string) {
        const activeSub = await this.subscriptionRepository.createQueryBuilder('sub')
            .leftJoinAndSelect('sub.plan', 'plan')
            .where('sub.driverId = :driverId', { driverId })
            .andWhere('sub.status = :status', { status: 'active' })
            .andWhere('sub.endDate > :now', { now: new Date() })
            .orderBy('sub.endDate', 'DESC')
            .getOne();

        if (!activeSub) {
            return null;
        }

        return activeSub;
    }
}
