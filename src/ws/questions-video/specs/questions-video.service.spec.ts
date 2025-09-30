import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Socket } from "socket.io";
import { v4 } from 'uuid';

import { User } from "../../../api/auth/entities/user.entity";
import { FileSegment } from "../../../api/files/entities/FileSegment.entity";
import { GeminiCacheMetadata } from "../../../common/entities/GeminiCacheMetadata.entity";
import { Tenant } from "../../../api/tenants/entities/tenant.entity";
import { QuestionsVideoService } from "../questions-video.service";
import { File } from "../../../api/files/entities/file.entity";
import { QuestionsVideoModule } from "../questions-video.module";
import { join } from "path";
import { existsSync, mkdirSync, rmSync } from "fs";
import { GeminiFileMetadata } from "../../../common/entities/GeminiFileMetadata.entity";


describe('files.service.spec.ts', () => {
    let questionVideoService: QuestionsVideoService;
    let module: TestingModule;
    const user: User = {
        id: 'cbc823dd-6aed-4bcc-a48b-c9963effec27',
        email: 'abdi@gmail.com',
        pass: 'null',
        fullname: 'Abdiel Pérez',
        isActive: true,
        roles: ['adminTenant'],
        permisos: ['uploadFiles', 'deleteFiles', 'addUser', 'deleteUser'],
        tenant: {
            id: '518c4fee-1444-420e-bbc7-c7b676782d02',
            nameTenant: 'Abdiel',
            slug: 'abdiel',
            isActive: true,
            users: [],
            files: []
        },
        files: [],
        checkFieldsBeforeInsert: function (): void {
            // throw new Error("Function not implemented.");
        },
        checkFieldsBeforeUpdate: function (): void {
            // throw new Error("Function not implemented.");
        }
    }
    let mockSocket: Partial<Socket>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot(),
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: process.env.PGHOST!,
                    port: +process.env.PGPORT!,
                    username: process.env.PGUSER!,
                    password: process.env.PGPASSWORD!,
                    database: process.env.PGDATABASE!,
                    entities: [
                        User,
                        File,
                        FileSegment,
                        GeminiCacheMetadata,
                        GeminiFileMetadata,
                        Tenant
                    ],
                    synchronize: true,
                    // dropSchema: true,
                }),
                QuestionsVideoModule //Agregamos todo el modulo que ya contiene todas las dependecias que necesita QUestionsVideoService para las inyecciones de dependencias de su constructor
            ]
        })
            .setLogger(console)
            .compile();
        questionVideoService = module.get<QuestionsVideoService>(QuestionsVideoService);
    });

    beforeEach(() => {
        // Crear mock del socket antes de cada test
        mockSocket = {
            id: v4(),
            emit: jest.fn(),
            join: jest.fn(),
            leave: jest.fn(),
            disconnect: jest.fn(),
            data: { user }, // Si necesitas datos del usuario
            handshake: {
                auth: {},
                headers: {},
                query: {},
                time: new Date().toISOString(),
                issued: Date.now(),
                url: '/socket.io/',
                xdomain: false,
                secure: false,
                address: '127.0.0.1'
            }
        };

        // Crear el directorio temporal del cliente cuando se conecta
        const clientPath = join('./filesTemp', mockSocket.id!);
        if (!existsSync(clientPath)) {
            mkdirSync(clientPath, { recursive: true });
        }
    });

    afterEach(async () => {
        const clientPath = join('./filesTemp', mockSocket.id!);
        if (existsSync(clientPath)) {
            rmSync(clientPath, { recursive: true });
        }
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    it('Test 1. Video no dividido',
        async () => {
            try {
                const result = await questionVideoService.main(
                    mockSocket as Socket,
                    {
                        videoId: '1f9b91c7-0eb6-4b6d-94ff-f373ad480294',
                        message: 'Hola'
                    }
                );
                console.log({ result });
            } catch (error) {
                fail(`No corrio el archivo spec`)

            }

        }, 300000 // 5 min de timeout
    );

    it('Test 2. Video que si está dividido',
        async () => {
            try {
                const result = await questionVideoService.main(
                    mockSocket as Socket,
                    {
                        videoId: '5ff254b0-5e94-4db3-87ad-1f21434e2117',
                        message: 'Hola'
                    }
                );
                console.log({ result });
            } catch (error) {
                fail(`No corrio el archivo spec`)

            }
        }
    );
    it('Test. Video no dividido y que no se puede hacer un cache',
        async () => {
            try {
                const result = await questionVideoService.main(
                    mockSocket as Socket,
                    {
                        videoId: '0693a7db-e139-4397-997f-58d2df21403d',
                        message: 'Hola'
                    }
                );
                console.log({ result });
            } catch (error) {
                fail(`No corrio el archivo spec`)

            }

        }, 300000 // 5 min de timeout
    );

    it('Test de comprobación. Verificar como estan los caches y filegena en Gemini despues del proceso',
        async () => {
            try {
                const result = await questionVideoService.showCacheAndFilesInGemini();
                console.dir(result, { depth: null, colors: true });

            } catch (error) {
                fail('NO se pudo ver los archivos y caches');
            }
        }
    );


});