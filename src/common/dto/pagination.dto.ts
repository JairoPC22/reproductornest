import { Type } from "class-transformer";
import { IsIn, IsOptional, IsPositive, IsString } from "class-validator";

export class PaginationDto {

    @IsOptional()
    @IsPositive()
    @Type( () => Number) //enableImplicitConversions: true
    limit?: number;

    @IsOptional()
    @IsPositive()
    @Type( () => Number)
    offset?: number;

    @IsString()
    @IsIn(['true', 'false'])
    @IsOptional()
    active?:string; //Para ver solo tenants activos
}