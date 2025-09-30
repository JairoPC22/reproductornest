### Roles
A continuación se describen las actividades permitidas para cada role:

1. __adminTenant__:

    * Crear usuarios
    * Eliminar usuarios
    * Asignar y remover roles a usuarios
    * Subir archivos
    * Eliminar archivos
    * Hacer consultas al agente de IA
    * Asignar permisos a usuarios
    * Remover permisos a usuarios
2. __adminFiles__:

    * Subir archivos
    * Eliminiar archivos
    * Hacer consultas al agente de IA
3. __consultor__:

    * Hacer consultas al agente de IA

NOTA: Las actividades de _asignar permisos, remover permisos, crear usuarios_ y _eliminar usuarios_ son solo para el rol de __admin-tenant__

### Permisos
Cada role puede tener o no ciertos permisos que solo el admin-tenant puede asignar. Los permisos son los siguientes:
1. addUser (default solo para admin-tenant)
2. deleteUser (default solo para admin-tenant)
1. uploadFiles
2. deleteFiles

Los permisos que tiene cada role por dafult son:

#### adminTenant:
1. addUser
2. deleteUser
3. uploadFiles
4. deleteFiles

#### adminFiles:
1. uploadFiles
2. deleteFiles

#### consultor:
* None

NOTA: Los permisos de _add-user_ y _delete-user_ son solo para el rol de __admin-tenant__

### Files
#### Requisitos para ver el archivo:
1. Ser Usuario activo
2. Que el usuario pertenezca al mismo tenant que el archivo
