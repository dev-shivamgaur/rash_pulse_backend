/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, type StrategyOptions } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
    'jwt'
) {
  constructor(private readonly configService: ConfigService) {
    // 1. Yeh log check karne ke liye hai ki strategy nestjs mein register hui ya nahi
    console.log('✅ JwtStrategy Initialized Successfully!');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = req?.cookies?.accessToken;
          console.log('=== EXTRACTING TOKEN FROM COOKIE ===', token ? 'Token Found' : 'No Token');
          return token;
        }
      ]),
      ignoreExpiration: false,
      // 2. Fat arrow function (=>) context sahi rakhta hai
      secretOrKeyProvider: (request: any, rawJwtToken: any, done: any) => {
        try {
          console.log('=== PROVIDING SECRET KEY ===');
          const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
          done(null, secret);
        } catch (error) {
          console.error('❌ Error getting secret inside provider:', error);
          done(error, null);
        }
      },
    });
  }

  async validate(payload: JwtPayload) {
    console.log('=== VALIDATING PAYLOAD ===', payload);
    
    // 3. Agar payload nahi hai, tab error throw karo
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    // 4. Sahi hone par payload return karo (yeh req.user mein save hoga)
    return payload;
  }
}