import { IsArray, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { AllValidPermisosArray } from "../../../common/interfaces/valid-permisos.enum";
import { AllValidRolesArray } from "../../../common/interfaces/valid-roles";

export class CreateUserDto {

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(5)
    @MaxLength(20)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    pass: string;

    @IsString()
    @MinLength(4)
    fullname: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @IsIn(AllValidRolesArray, { each: true })
    roles?: string[];

    @IsArray()
    @IsString({each: true})
    @IsOptional()
    @IsIn(AllValidPermisosArray, {each: true}) //['addUser' 'deleteUser' 'addFiles' 'deleteFiles']
    permisos?: string[]; 

}
