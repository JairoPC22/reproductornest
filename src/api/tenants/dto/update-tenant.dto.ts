import { PartialType } from '@nestjs/mapped-types';
import { CreateTenantDto } from './create-tenant.dto';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
    @IsString()
    @IsIn(['true', 'false'])
    @IsOptional()
    isActive?: string;

    //NO lo manejamos bool porque es más propenso a errores
}
