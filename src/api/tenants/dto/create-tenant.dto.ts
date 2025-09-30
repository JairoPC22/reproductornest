import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateTenantDto {
    @IsString()
    @MinLength(1)
    @MaxLength(30)
    nameTenant: string;

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
}
