import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, IsUUID, MinLength } from "class-validator";
import { validVideoInstructions } from "src/common/interfaces/valid-instructions";

export class IaVideoFunctionDto {
    
    @IsUUID()
    @ApiProperty()
    fileId: string;
    
    @IsString()
    @MinLength(2)
    @IsIn(Object.keys(validVideoInstructions))
    @ApiProperty({enum: Object.keys(validVideoInstructions)})
    iaInstruction: string;
}
