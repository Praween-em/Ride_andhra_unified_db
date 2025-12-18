
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Driver } from '../../profile/entities/driver.entity';

export enum RideStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rider_id' })
  user: User;

  @Column({ name: 'rider_id' })
  riderId: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  // Pickup location fields
  @Column({ type: 'decimal', name: 'pickup_latitude' })
  pickupLatitude: number;

  @Column({ type: 'decimal', name: 'pickup_longitude' })
  pickupLongitude: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'pickup_location',
  })
  pickupLocationGeo: any;

  @Column({ name: 'pickup_address' })
  pickupLocation: string;

  // Dropoff location fields
  @Column({ type: 'decimal', name: 'dropoff_latitude' })
  dropoffLatitude: number;

  @Column({ type: 'decimal', name: 'dropoff_longitude' })
  dropoffLongitude: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'dropoff_location',
  })
  dropoffLocationGeo: any;

  @Column({ name: 'dropoff_address' })
  dropoffLocation: string;

  // Vehicle and fare information
  @Column({ name: 'vehicle_type', nullable: true })
  vehicleType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'estimated_distance_km', nullable: true })
  distance: number;

  @Column({ type: 'int', name: 'estimated_duration_min', nullable: true })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'estimated_fare', nullable: true })
  fare: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'actual_distance_km', nullable: true })
  actualDistance: number;

  @Column({ type: 'int', name: 'actual_duration_min', nullable: true })
  actualDuration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'final_fare', nullable: true })
  finalFare: number;

  // Ride status - THIS IS THE MAIN STATUS COLUMN
  @Column({
    type: 'enum',
    enum: RideStatus,
    default: RideStatus.PENDING,
    nullable: true,
  })
  status: RideStatus;

  // Cancellation fields
  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  // Rating and review fields
  @Column({ type: 'decimal', precision: 3, scale: 2, name: 'rider_rating', nullable: true })
  riderRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, name: 'driver_rating', nullable: true })
  driverRating: number;

  @Column({ name: 'rider_review', type: 'text', nullable: true })
  riderReview: string;

  @Column({ name: 'driver_review', type: 'text', nullable: true })
  driverReview: string;

  // Timestamp fields
  @Column({ type: 'timestamp', name: 'requested_at', nullable: true })
  requestedAt: Date;

  @Column({ type: 'timestamp', name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  // Rider PIN verification fields
  @Column({ name: 'rider_pin_entered_by_driver', default: false })
  riderPinEnteredByDriver: boolean;

  @Column({ type: 'timestamp', name: 'rider_pin_verified_at', nullable: true })
  riderPinVerifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
