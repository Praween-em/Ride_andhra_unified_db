import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { GetWalletDto } from './dto/get-wallet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get()
  getWalletBalance(@Req() req: any) {
    const userId = req.user.userId;
    return this.walletService.getWalletBalance(userId);
  }

  @Post('add-funds')
  addFunds(@Body() getWalletDto: GetWalletDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.walletService.addFunds(userId, getWalletDto.amount);
  }
}
