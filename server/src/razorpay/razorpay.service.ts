import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
    private razorpay: any;

    constructor(private configService: ConfigService) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
        });
    }

    async createOrder(amount: number, currency: string, receipt: string) {
        try {
            const options = {
                amount: amount, // amount in smallest currency unit (paise for INR)
                currency: currency,
                receipt: receipt,
            };

            const order = await this.razorpay.orders.create(options);
            return {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
            };
        } catch (error) {
            throw new BadRequestException('Failed to create Razorpay order: ' + error.message);
        }
    }

    verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string,
    ): boolean {
        try {
            const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
            const text = orderId + '|' + paymentId;

            const generatedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(text)
                .digest('hex');

            return generatedSignature === signature;
        } catch (error) {
            return false;
        }
    }

    async fetchPaymentDetails(paymentId: string) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            throw new BadRequestException('Failed to fetch payment details: ' + error.message);
        }
    }
}
