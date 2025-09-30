import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLegalCaseDto } from './create-legal-case.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLegalCaseDto extends PartialType(CreateLegalCaseDto) {

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, description: 'optional' })
    caseSummary?: string;
}
