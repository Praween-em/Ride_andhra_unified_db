import {
    Entity,
    PrimaryColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('rider_profiles')
export class RiderProfile {
    @PrimaryColumn('uuid')
    user_id: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column('decimal', { precision: 3, scale: 2, default: 5.0 })
    rider_rating: number;

    @Column('integer', { default: 0 })
    total_rides: number;

    @Column({ type: 'jsonb', nullable: true })
    favorite_locations: any;

    @Column({ type: 'boolean', default: true })
    pin_required: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
