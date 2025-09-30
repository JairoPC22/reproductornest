import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger, UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    private readonly logger = new Logger('auth.service');

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService
    ) { }
    async create(createUserDto: CreateUserDto) {

        const { pass, ...userData } = createUserDto;

        try {
            const user = this.userRepository.create({
                ...userData,
                pass: bcrypt.hashSync(pass, 10)
            })
            await this.userRepository.save(user);
            return {
                ...user,
                token: this.getJwtToken({ id: user.id })
            }

        } catch (error) {
            this.handleDbError(error);

        }

    }

    // async createAdminTenant(createAdminTenantDto: CreateAdminTenantDto) {
    //     //TODO: Agregar contraseña para crear un admin tanent
    //     const { pass, ...adminInfo } = createAdminTenantDto;
    //     try {
    //         const userAdminTenant = this.userRepository.create(
    //             {
    //                 pass: bcrypt.hashSync(pass, 10),//10 vueltas,
    //                 ...adminInfo,
    //                 roles: [ValidRoles.adminTenant],
    //                 permisos: AllValidPermisosArray
    //             }
    //         );
    //         await this.userRepository.save(userAdminTenant);
    //         return adminInfo;

    //     } catch (error) {
    //         this.logger.error(`NO fue posible crear el usuario admin tenant. ${error}`)
    //         throw new BadRequestException(`${error.detail}`);

    //     }

    // }

    async login(loginUserDto: LoginUserDto) {
        const { pass, email } = loginUserDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: {
                email: true,
                pass: true,
                id: true,
                roles: true,
                permisos: true,
                isActive: true
            }
        });

        if (!user) throw new UnauthorizedException(`Credentials are not valid (email)`);

        if (!bcrypt.compareSync(pass, user.pass)) throw new UnauthorizedException(`Credential are not valid (password)`);

        if (!user.isActive) throw new UnauthorizedException(`User is not active`);

        return {
            token: this.getJwtToken({ id: user.id })
        }
    }

    private getJwtToken(payload: JwtPayload) {
        const token = this.jwtService.sign(payload);
        return token;

    }

    private handleDbError(error: any): never {
        //Si añade un usaurio que ya existe
        if (error.code === '23505') {
            this.logger.error(error.detail);
            throw new BadRequestException(error.detail);
        }

        this.logger.error(error);
        throw new InternalServerErrorException(`Please check server logs`);

    }
}
