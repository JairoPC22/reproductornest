export enum ValidPermisos {
    addUser = "addUser",
    deleteUser = "deleteUser",
    uploadFiles = "uploadFiles",
    deleteFiles = "deleteFiles",
    
}

export const AllValidPermisosArray = [
    // ValidPermisos.addUser, //Solo el adminTenant tiene esos permisos
    // ValidPermisos.deleteUser,
    ValidPermisos.uploadFiles,
    ValidPermisos.deleteFiles,
];