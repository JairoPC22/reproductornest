<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Dacuai backend
1. CLonar proyecto
2. ```yarn install```
3. CLonar el archivo  ```.env.template``` y renombrarlo a ```.env```
4. Cambiar las variables de entorno
5. Levantar la DB ```docker compose up -d```
6. Levantar ```yarn start:dev```
7. Puedes Utilizar PgAdmin para visualizar la db en ```http://localhost:5050```

### Notas:
La base de datos está levantada en el puerto 5432 para ser accedida.
Es necesario tener docker instalado para levantar la db

### Usuario admin tenant default

email: dacuai@dacuai.com
pass: Nora2040

## Stack utilizado
1. Para utilizar Variables de entorno: `yarn add @nestjs/config`
2. Postgres `yarn add @nestjs/typeorm typeorm pg`
3. Class validator y class transformer ```yarn add class-validator class-transformer```
4. UUID: `yarn add uuid` y `yarn add @types/uuid`
5. FileUpload para archivos ```$ npm i -D @types/multer```.
6. bcrypt ```yarn add bcrypt``` y para instalar los tipos de typescript (solo para desarrollo): ```yarn add -D @types/bcrypt```
7. Authentication```yarn add @nestjs/jwt passport-jwt``` ```yarn add -D @types/passport-jwt```
8. Passport ```yarn add @nestjs/passport passport```
9. [PgAdmin](https://www.pgadmin.org/docs/pgadmin4/latest/container_deployment.html)
10. [Busboy](https://www.npmjs.com/package/busboy) para streaming de archivos
11. [Gateway](https://docs.nestjs.com/websockets/gateways) 
```yarn add @nestjs/websockets @nestjs/platform-socket.io```
12. Websockets. Ver mas info sobre websokets [aquí](https://socket.io/). Nota: Los websockets no son propios de nest
```yarn add socket.io```
Ademas, para el lado cel cliente necesitamos instalar el websocket client: ```yarn add socket.io-client```. Es importante que la versión que se instale del lado del cliente haga match con la versión del lado de aquí del servidor/backend, al momento de instalar en el lado del cliente la versión se ve algo así: _socket.io-client@4.8.1_ y al entrar en el endpoint del back de _127.0.0.1:3000/socket.io/socket.io.js_ la versión se ve algo así: _Socket.IO v4.8.1_
13. MOngoose db para guardar las convesaciones. ```@nestjs/mongoose mongoose```