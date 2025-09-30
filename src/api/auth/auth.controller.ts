import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Auth } from './decorators/auth.decorator';
import { LoginUserDto } from './dto/login-user.dto';
import { ValidRoles } from '../../common/interfaces/valid-roles';
import { ApiCreatedResponse, ApiExcludeEndpoint, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiCreatedResponse({
    description: 'Si se autentica con éxito, devuelve el token con duración de 5h que incluye la información del usuario',
    schema: {
      example: { token: 'string' },
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Si la contraseña o el email es incorrecto',
    example: {
      message: 'Credentials are not valid (email | password)',
      error: 'Unauthorized',
      statusCode: 401
    } 
  })
  loginUser(@Body() loginUserDto: LoginUserDto){
    return this.authService.login(loginUserDto)
  }

  //Solo admin-tenant puede registrar usuarios
  @Post('register')
  @ApiExcludeEndpoint()
  @Auth(ValidRoles.adminTenant)
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }


}
