
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { DriverDocument } from './driver-document.entity';

@Entity('driver_profiles')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'vehicle_model', nullable: true })
  vehicleModel: string;

  @Column({ name: 'vehicle_color', nullable: true })
  vehicleColor: string;

  @Column({ name: 'vehicle_plate_number', unique: true, nullable: true })
  vehiclePlateNumber: string;

  @Column({ name: 'vehicle_type', nullable: true })
  vehicleType: string;

  @OneToMany(() => DriverDocument, (document) => document.driver)
  documents: DriverDocument[];

  @Column({ name: 'driver_rating', type: 'decimal', precision: 3, scale: 2, default: 5.00 })
  driverRating: number;

  @Column({ name: 'total_rides', default: 0 })
  totalRides: number;

  @Column({ name: 'earnings_total', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  earningsTotal: number;

  @Column({ name: 'is_available', default: false })
  isAvailable: boolean;

  @Column({ default: false, name: 'is_online' })
  isOnline: boolean;

  @Column({ type: 'decimal', nullable: true, name: 'current_latitude' })
  currentLatitude: number;

  @Column({ type: 'decimal', nullable: true, name: 'current_longitude' })
  currentLongitude: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'current_location',
  })
  currentLocation: any;

  @Column({ name: 'current_address', nullable: true })
  currentAddress: string;

  @Column({ name: 'status', default: 'pending_approval' })
  status: string;

  @Column({ name: 'document_submission_status', default: 'pending' })
  documentSubmissionStatus: string;

  @Column({ name: 'background_check_passed', default: false })
  backgroundCheckPassed: boolean;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;
}
