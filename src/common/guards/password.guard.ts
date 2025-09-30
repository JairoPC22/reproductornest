import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Observable } from "rxjs";
import * as bcrypt from 'bcrypt'
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PasswordToCreateTenant implements CanActivate {
    constructor(
        private readonly configService: ConfigService
    ){}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const req = context.switchToHttp().getRequest();
        const passwordFromUser = req.headers['password'];
        if (!passwordFromUser ) throw new BadRequestException(`Password was not provided`);

        const passHashed = this.configService.get('TENANT_PASSWORD_HASHED');
        if(!bcrypt.compareSync(passwordFromUser, passHashed))
            throw new ForbiddenException(`Password is wrong`);
        return true;
    }

}