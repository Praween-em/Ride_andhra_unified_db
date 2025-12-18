import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum VehicleType {
    BIKE = 'bike',
    AUTO = 'auto',
    CAR = 'car',
    PREMIUM = 'premium',
    PARCEL = 'parcel',
    BIKE_LITE = 'bike_lite',
}

@Entity('fare_settings')
export class FareSetting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: VehicleType,
        unique: true,
    })
    vehicle_type: VehicleType;

    @Column('decimal', { precision: 8, scale: 2 })
    base_fare: number;

    @Column('decimal', { precision: 8, scale: 2 })
    per_km_rate: number;

    @Column('decimal', { precision: 8, scale: 2 })
    per_minute_rate: number;

    @Column('decimal', { precision: 8, scale: 2 })
    minimum_fare: number;

    @Column('decimal', { precision: 4, scale: 2, default: 1.0 })
    surge_multiplier: number;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
