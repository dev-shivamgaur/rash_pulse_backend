/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    console.log('✅ JwtStrategy Initialized Successfully!');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. First priority: Cookie se token extract karo
        (req: Request) => {
          let token: string | null = null;
          
          // Cookie-parser middleware se parsed cookies
          if (req?.cookies && req.cookies['accessToken']) {
            token = req.cookies['accessToken'];
          } 
          // Fallback: Agar cookie-parser nahi chala, toh raw header string parse karo
          else if (req?.headers?.cookie) {
            const rawCookie = req.headers.cookie
              .split(';')
              .find((c) => c.trim().startsWith('accessToken='));
            if (rawCookie) {
              token = rawCookie.split('=')[1];
            }
          }

          console.log(
            '=== EXTRACTING TOKEN FROM COOKIE ===',
            token ? 'Token Found' : 'No Token Found'
          );
          return token;
        },

        // 2. Second priority: Bearer token in Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),

      ignoreExpiration: false,
      
      // Dynamic Secret Key Provider
      secretOrKeyProvider: (request: any, rawJwtToken: any, done: any) => {
        try {
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

    if (!payload) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Yeh payload automatically req.user mein assign ho jayega
    return payload;
  }
}