import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyWidgetDto } from './dto/verify-widget.dto';
import { LoginByPhoneDto } from './dto/login-by-phone.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('verify-widget')
  async verifyWidget(@Body() verifyWidgetDto: VerifyWidgetDto) {
    console.log('DEBUG: Auth controller: /verify-widget endpoint hit');
    return await this.authService.verifyWidgetOtp(verifyWidgetDto.accessToken);
  }

  @Post('login-by-phone')
  async loginByPhone(@Body() loginByPhoneDto: LoginByPhoneDto) {
    console.log('DEBUG: Auth controller: /login-by-phone endpoint hit');
    return await this.authService.loginByPhone(loginByPhoneDto.phoneNumber);
  }
}
