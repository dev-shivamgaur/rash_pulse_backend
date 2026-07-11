import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
 
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          secret: config.get<string>('JWT_ACCESS_SECRET'),
        })
      }),
     PassportModule],
  providers: [JwtStrategy, RolesGuard],
  exports: [JwtStrategy, RolesGuard, PassportModule],
})
export class JwtSharedModule {
  constructor(){
    console.log(process.env.JWT_ACCESS_SECRET)
  }
}