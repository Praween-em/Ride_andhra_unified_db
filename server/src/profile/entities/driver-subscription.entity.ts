
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('driver_subscriptions')
export class DriverSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'driver_id' })
    driverId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'driver_id' })
    driver: User;

    @Column({ name: 'plan_id', nullable: true })
    planId: string;

    @ManyToOne(() => SubscriptionPlan)
    @JoinColumn({ name: 'plan_id' })
    plan: SubscriptionPlan;

    @Column({ name: 'start_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamptz' })
    endDate: Date;

    @Column({ default: 'active' })
    status: string;

    @Column({ name: 'is_paid', default: false })
    isPaid: boolean;

    @Column({ name: 'payment_id', nullable: true })
    paymentId: string;

    @Column({ name: 'razorpay_payment_id', nullable: true })
    razorpayPaymentId: string;

    @Column({ name: 'auto_renew', default: false })
    autoRenew: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
