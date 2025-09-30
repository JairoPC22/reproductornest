import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { File } from '../files/entities/file.entity';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule, //Para las variables de entorno
    TypeOrmModule.forFeature([User, File]),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:[ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret:configService.get('JWT_SECRET'),
          signOptions:{
            expiresIn: '8h'
          }
        }

      }
    }),
  ],
  exports: [TypeOrmModule, PassportModule, JwtModule, JwtStrategy]
})
export class AuthModule {}
