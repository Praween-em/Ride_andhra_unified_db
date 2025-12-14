import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    // This payload is the one we "signed" (e.g., { sub: user.id, phoneNumber, roles })
    // Return user data that will be attached to request.user
    return {
      userId: payload.sub,
      phoneNumber: payload.phoneNumber,
      roles: payload.roles || []
    };
  }
}
