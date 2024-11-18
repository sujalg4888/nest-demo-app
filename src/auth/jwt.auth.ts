// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'secretKey',
    });
  }

  /** Validates the JWT payload and returns the user information.
   * @remarks
   * This function is used by the {@link JwtStrategy} to validate the JWT payload
   * extracted from the request. It extracts the user ID and username from the payload
   * and returns them as an object.
   * @param payload - The JWT payload containing the user information.
   * @returns An object containing the user ID and username extracted from the payload.
   */
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
