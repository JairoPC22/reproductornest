import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { META_PERMISSIONS } from "../decorators/permission-protected.decorator";

@Injectable()
export class UserPermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector

    ){}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const validPermissions: string[] = this.reflector.get(META_PERMISSIONS, context.getHandler());

        //Si no se asignan roles lo dejamos pasar:
        if(!validPermissions) return true;
        if(validPermissions.length === 0) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user;

        if(!user) throw new BadRequestException(`User not found`);

        for (const permission of user.permisos) {
            if (validPermissions.includes(permission)) return true;
        }
        throw new ForbiddenException(`User ${user.fullname} needs a valid permission: ${validPermissions}`);
    }

}