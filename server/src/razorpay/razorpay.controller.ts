import {
    Controller,
    Post,
    Body,
    BadRequestException,
    UseGuards,
    Request,
} from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileService } from '../profile/profile.service';

@Controller('razorpay')
@UseGuards(JwtAuthGuard)
export class RazorpayController {
    constructor(
        private readonly razorpayService: RazorpayService,
        private readonly profileService: ProfileService,
    ) { }

    @Post('create-order')
    async createOrder(@Body() body: { amount: number; currency: string; receipt: string }) {
        const { amount, currency, receipt } = body;

        if (!amount || !currency) {
            throw new BadRequestException('Amount and currency are required');
        }

        return await this.razorpayService.createOrder(amount, currency, receipt);
    }

    @Post('verify-payment')
    async verifyPayment(
        @Request() req,
        @Body()
        body: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
            planDetails?: {
                planName: string;
                amount: number;
                validity: string;
            };
        },
    ) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planDetails } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new BadRequestException('Missing payment verification parameters');
        }

        // Verify signature
        const isValid = this.razorpayService.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        );

        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Fetch payment details from Razorpay to confirm status
        const paymentDetails = await this.razorpayService.fetchPaymentDetails(razorpay_payment_id);

        if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
            throw new BadRequestException('Payment not successful');
        }

        // TODO: Update user subscription/wallet based on planDetails
        // For now, we'll just return success
        // You can integrate with WalletService or create a SubscriptionService

        return {
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: paymentDetails.amount / 100, // Convert paise to rupees
            status: paymentDetails.status,
        };
    }
}
