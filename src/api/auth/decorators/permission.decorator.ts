import { applyDecorators, UseGuards } from "@nestjs/common";
import { ValidPermisos } from "src/common/interfaces/valid-permisos.enum";
import { PermissionProtected } from "./permission-protected.decorator";
import { UserPermissionGuard } from "../guards/permission.guard";
import { AuthGuard } from "@nestjs/passport";

export function CheckPermissions(...permissions: ValidPermisos[]){
    return applyDecorators(
        PermissionProtected(...permissions),
        UseGuards(AuthGuard(),UserPermissionGuard)
    );
}