import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Ride } from './ride.entity';
import { Driver } from '../../profile/entities/driver.entity';

@Entity('ride_rejections')
export class RideRejection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Ride)
    @JoinColumn({ name: 'ride_id' })
    ride: Ride;

    @ManyToOne(() => Driver)
    @JoinColumn({ name: 'driver_id' })
    driver: Driver;

    @CreateDateColumn({ name: 'rejected_at' })
    rejectedAt: Date;
}
