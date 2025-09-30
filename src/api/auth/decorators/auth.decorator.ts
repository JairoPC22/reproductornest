import { applyDecorators, UseGuards } from "@nestjs/common";
import { RoleProtected } from "./role-protected.decorator";
import { AuthGuard } from "@nestjs/passport";
import { UserRoleGuard } from "../guards/user-role.guard";
import { ValidRoles } from "src/common/interfaces/valid-roles";

export function Auth(...roles: ValidRoles[]){
    return applyDecorators(
        RoleProtected(...roles),
        UseGuards(AuthGuard(), UserRoleGuard)
    );
}