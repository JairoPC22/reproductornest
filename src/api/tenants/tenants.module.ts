import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { ConfigModule } from '@nestjs/config';
import { User } from 'src/api/auth/entities/user.entity';

@Module({
  imports:[
    ConfigModule,
    TypeOrmModule.forFeature([Tenant, User]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TypeOrmModule]
})
export class TenantsModule {}
