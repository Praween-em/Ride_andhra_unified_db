import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { FareSetting } from './fare-setting.entity';

@Entity('fare_tiers')
export class FareTier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => FareSetting)
    @JoinColumn({ name: 'fare_setting_id' })
    fareSetting: FareSetting;

    @Column({ name: 'fare_setting_id' })
    fareSettingId: string;

    @Column('decimal', { precision: 8, scale: 2 })
    km_from: number;

    @Column('decimal', { precision: 8, scale: 2 })
    km_to: number;

    @Column('decimal', { precision: 8, scale: 2 })
    per_km_rate: number;
}
