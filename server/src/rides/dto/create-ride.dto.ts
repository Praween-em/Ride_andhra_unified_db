import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateRideDto {
  @IsString()
  @IsOptional()
  pickupLocation?: string;

  @IsString()
  @IsOptional()
  pickup_address?: string;

  @IsNumber()
  @IsOptional()
  pickupLatitude?: number;

  @IsNumber()
  @IsOptional()
  pickup_latitude?: number;

  @IsNumber()
  @IsOptional()
  pickupLongitude?: number;

  @IsNumber()
  @IsOptional()
  pickup_longitude?: number;

  @IsString()
  @IsOptional()
  dropoffLocation?: string;

  @IsString()
  @IsOptional()
  dropoff_address?: string;

  @IsNumber()
  @IsOptional()
  dropoffLatitude?: number;

  @IsNumber()
  @IsOptional()
  dropoff_latitude?: number;

  @IsNumber()
  @IsOptional()
  dropoffLongitude?: number;

  @IsNumber()
  @IsOptional()
  dropoff_longitude?: number;

  @IsNumber()
  @IsOptional()
  fare?: number;

  @IsNumber()
  @IsOptional()
  distance?: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsString()
  @IsOptional()
  vehicle_type?: string;

  @IsString()
  @IsOptional()
  riderId?: string;
}
