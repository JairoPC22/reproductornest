import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from 'src/api/auth/dto/create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @IsIn(['true', 'false'])
    @IsOptional()
    isActive?: string;
}
