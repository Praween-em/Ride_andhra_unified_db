import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Driver } from '../profile/entities/driver.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Msg91Service } from '../msg91/msg91.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly msg91Service: Msg91Service,
  ) { }

  /**
   * Normalize phone number to 10 digits without country code
   * Handles: +919876543210, 919876543210, 9876543210
   * Returns: 9876543210
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // If starts with 91 and has 12 digits total, remove the 91
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      return digitsOnly.substring(2);
    }

    // If already 10 digits, return as is
    if (digitsOnly.length === 10) {
      return digitsOnly;
    }

    // Otherwise return the last 10 digits
    return digitsOnly.slice(-10);
  }

  private async generateJwtToken(user: User): Promise<string> {
    const payload = {
      phoneNumber: user.phone_number,
      sub: user.id,
      roles: user.roles,
      name: user.name || '',
    };
    return this.jwtService.sign(payload);
  }

  private async findOrCreateUserByPhone(phoneNumber: string) {
    console.log(`DEBUG: findOrCreateUserByPhone lookup for: "${phoneNumber}"`);
    
    // Find user or create if they don't exist
    let user = await this.userRepository.findOne({
      where: { phone_number: phoneNumber },
      relations: []
    });
    
    const user_exists = !!user;
    console.log(`DEBUG: DB lookup result: ${user_exists ? 'FOUND' : 'NOT FOUND'}`);

    if (!user) {
      console.log(`DEBUG: Creating NEW user in database for: ${phoneNumber}`);
      const newUser = this.userRepository.create({
        phone_number: phoneNumber,
        name: '', // Initialize name as empty string
        roles: [UserRole.RIDER],
      });
      user = await this.userRepository.save(newUser);
    } else {
      console.log(`DEBUG: Existing user fetched: ID=${user.id}, Name="${user.name}"`);
    }

    // Check if user has a driver profile
    const driverProfile = await this.driverRepository.findOne({
      where: { user_id: user.id }
    });

    const token = await this.generateJwtToken(user);

    const response = {
      message: user_exists ? 'Login successful' : 'User registered successfully',
      token,
      accessToken: token, // Alias for Rider App
      isNewUser: !user_exists, // CRITICAL: This determines if EnterNameScreen shows
      user: {
        id: user.id,
        phone_number: user.phone_number,
        name: user.name || '', // Ensure name is never null
        roles: user.roles,
        is_rider: user.roles.includes(UserRole.RIDER) || !driverProfile,
        is_driver: !!driverProfile || user.roles.includes(UserRole.DRIVER),
        driver_status: driverProfile?.status || null,
        is_verified: user.is_verified,
        driver_id: driverProfile?.user_id || null,
      },
      user_exists,
    };

    console.log(`DEBUG: Final Auth Response for ${phoneNumber} - isNewUser: ${response.isNewUser}, Name: "${response.user.name}"`);
    return response;
  }

  async loginByPhone(phoneNumber: string) {
    return this.findOrCreateUserByPhone(phoneNumber);
  }

  async verifyWidgetOtp(accessToken: string) {
    const authKey = this.configService.get<string>('MSG91_AUTH_KEY');
    const url = 'https://control.msg91.com/api/v5/widget/verifyAccessToken';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authkey: authKey,
        'access-token': accessToken,
      }),
    });

    const data = await response.json();

    if (data.type !== 'success') {
      console.error('DEBUG: MSG91 Widget Verification Failed:', data);
      throw new UnauthorizedException('Invalid or expired OTP session.');
    }

    const phoneNumber = this.normalizePhoneNumber(data.mobile);
    return this.findOrCreateUserByPhone(phoneNumber);
  }

  async sendOtp(phoneNumber: string) {
    const authKey = this.configService.get<string>('MSG91_AUTH_KEY');
    const templateId = this.configService.get<string>('MSG91_TEMPLATE_ID');

    let mobile = phoneNumber;
    if (!mobile.startsWith('91')) {
      mobile = '91' + mobile;
    }

    const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Param1: "value1",
          Param2: "value2"
        })
      });
      const data = await response.json();

      if (data.type === 'success') {
        return { message: 'OTP sent successfully', reqId: data.request_id };
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      throw new Error('Failed to send OTP');
    }
  }

  async verifyOtp(phoneNumber: string, otp: string) {
    // 1. Test Credentials Bypass
    if (phoneNumber.endsWith('1234567890') && otp === '123456') {
      console.log('DEBUG: Test credentials (1234567890) matched. Bypassing MSG91.');
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      return this.findOrCreateUserByPhone(normalizedPhone);
    }

    const authKey = this.configService.get<string>('MSG91_AUTH_KEY');
    let mobile = phoneNumber;
    if (!mobile.startsWith('91')) {
      mobile = '91' + mobile;
    }

    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${mobile}&authkey=${authKey}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();

      if (data.type === 'success') {
        const normalizedPhone = this.normalizePhoneNumber(mobile);
        return this.findOrCreateUserByPhone(normalizedPhone);
      } else {
        console.error('DEBUG: MSG91 Verify Response failed:', data);
        throw new UnauthorizedException('Invalid OTP');
      }
    } catch (error) {
      console.error('DEBUG: OTP Verify Exception:', error);
      throw new UnauthorizedException('Invalid OTP');
    }
  }

  async loginVerified(phoneNumber: string) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.findOrCreateUserByPhone(normalizedPhone);
  }
}
