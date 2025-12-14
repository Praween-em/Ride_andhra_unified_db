import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Driver } from '../../profile/entities/driver.entity';

export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'phone_number' })
  phone_number: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.RIDER],
  })
  roles: UserRole[];

  @OneToOne(() => Driver, (driver) => driver.user)
  driver: Driver;

  @Column({ default: false })
  is_verified: boolean;

  @Column({ type: 'text', nullable: true, name: 'push_token' })
  pushToken: string;

  @Column({ type: 'varchar', length: 4, nullable: true, name: 'rider_pin' })
  ridePin: string;

  @CreateDateColumn()
  created_at: Date;
}