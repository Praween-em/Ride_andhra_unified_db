import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber(null) // Use null for region-agnostic phone number validation
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsString()
  @IsNotEmpty()
  vehicleColor: string;

  @IsString()
  @IsNotEmpty()
  vehiclePlateNumber: string;
}