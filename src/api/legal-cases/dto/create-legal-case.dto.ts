import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateLegalCaseDto {

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, description: 'optional' })
    title?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, description: 'optional' })
    description?: string;

}
