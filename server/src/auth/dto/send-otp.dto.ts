import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsPhoneNumber('IN') // Assuming Indian phone numbers, adjust if necessary
  @IsNotEmpty()
  phoneNumber: string;
}
