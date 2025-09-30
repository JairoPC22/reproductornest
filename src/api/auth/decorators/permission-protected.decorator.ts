import { SetMetadata } from "@nestjs/common";
import { ValidPermisos } from "src/common/interfaces/valid-permisos.enum";

export const META_PERMISSIONS = 'permissions';
export const PermissionProtected = (...args: ValidPermisos[]) => {

    return SetMetadata(META_PERMISSIONS, args)

}