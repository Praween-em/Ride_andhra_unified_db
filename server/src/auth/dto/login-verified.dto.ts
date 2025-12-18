import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class LoginVerifiedDto {
    @IsString()
    @IsNotEmpty()
    @Length(10, 15)
    @Matches(/^\d+$/, { message: 'Phone number must contain only digits' })
    phoneNumber: string;
}
