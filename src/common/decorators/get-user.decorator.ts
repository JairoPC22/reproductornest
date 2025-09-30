import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const GetUser = createParamDecorator(
    (data, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if(!user) throw new InternalServerErrorException(`User not found in request`);
        
        return (!data)? user:user[data];
         /**
          * data es el contenido del decorador, ejem:
          * @GetUser('email') -> retorna solo el email -> user['email]
          * @GetUser() -> retorna todo el user -> email
         */
    }
)