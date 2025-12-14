import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsPhoneNumber('IN') // Assuming Indian phone numbers, adjust if necessary
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
