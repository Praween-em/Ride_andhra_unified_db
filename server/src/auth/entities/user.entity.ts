import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Column({ unique: true, name: 'phone_number', type: 'varchar', length: 15 })
  phone_number: string;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'users_role_enum',
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

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'profile_image' })
  profile_image: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
