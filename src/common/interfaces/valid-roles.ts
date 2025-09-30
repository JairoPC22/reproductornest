export enum ValidRoles {
    adminTenant = 'adminTenant',
    adminFiles = 'adminFiles',
    consultor =  'consultor'
}

export const AllValidRolesArray = [
    // ValidRoles.adminTenant, //Nadie puede crear un adminTenant
    ValidRoles.adminFiles,
    ValidRoles.consultor,
];