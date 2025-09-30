import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { copyFileSync } from "fs";

import { User } from "../../auth/entities/user.entity";
import { FileSegment } from "../entities/FileSegment.entity";
import { GeminiCacheMetadata } from "../../../common/entities/GeminiCacheMetadata.entity";
import { AwsS3Module } from "../../../modules/aws-s3/aws-s3.module";
import { SplitVideoModule } from "../../../modules/split-video/split-video.module";
import { FilesService } from "../files.service";
import { File } from "../entities/file.entity";
import { Tenant } from "../../tenants/entities/tenant.entity";
import { FilesModule } from "../files.module";
import { filesFromOneUser } from "../interfaces/filesFromOneUser.interface";
import { LegalCase } from "../../../api/legal-cases/entities/legal-case.entity";

describe('files.service.spec.ts', () => {
    let filesService: FilesService;
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
            files: [],
            legalCases: [],
        },
        files: [],
        legalCases: [],
        checkFieldsBeforeInsert: function (): void {
            // throw new Error("Function not implemented.");
        },
        checkFieldsBeforeUpdate: function (): void {
            // throw new Error("Function not implemented.");
        }
    }

    let newFile: filesFromOneUser; //Aquí se guarda el file que se sube en el test 1

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
                    entities: [User, File, FileSegment, GeminiCacheMetadata, Tenant, LegalCase],
                    synchronize: true,
                    // dropSchema: true,
                }),
                // TypeOrmModule.forFeature([User, File, FileSegment, GeminiCacheMetadata]),
                AwsS3Module,
                SplitVideoModule,
                FilesModule
            ]
        }).compile();
        filesService = module.get<FilesService>(FilesService);
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
    });

    it('Test 1. Borramos todos los archivos de un usuario',
        async () => {
            try {
                await filesService.removeAllFilesFromOneUser(user);
                console.log(`Se borraron todos los archivos de ${user.fullname}`);
            } catch (error) {
                fail(`No se pudieron borrar todos los archivos de un usuario -> ${error}`);

            }
        }
    )
});