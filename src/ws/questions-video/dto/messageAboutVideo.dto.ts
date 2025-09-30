// import { ApiProperty } from "@nestjs/swagger";
import {  IsString, IsUUID, MinLength } from "class-validator";

export class MessageAboutVideoDto {

    //TODO: Implementar el id de la conversación para recuperar toda la conversación
    @IsUUID()
    videoId: string;

    @IsString()
    @MinLength(1)
    message: string;


}
