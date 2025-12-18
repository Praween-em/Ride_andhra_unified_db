import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionOrderDto {
    @IsString()
    @IsNotEmpty()
    planId: string;
}
