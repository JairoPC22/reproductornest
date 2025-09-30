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
                    entities: [User, File, FileSegment, GeminiCacheMetadata, Tenant],
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

    it('Test 1. Subir un video que no necesita dividirse',
        async () => {

            const fileForTest = {
                originalname: 'tiktokMichi.mp4',
                mimetype: 'video/mp4',
                size: 3059255,
                user,
                extension: '.mp4'
            }

            //copiamos el archivo a la carpeta temporal simulando a multer
            const sourcePath = './static/videos/tiktokMichi.mp4';
            const destinationPath = './filesUploadedTemp/tiktokMichi.mp4';
            try {
                copyFileSync(sourcePath, destinationPath);
            } catch (error) {
                fail(`Error al copiar archivo -> ${error}`);
            }

            //subimos el video
            console.log(`Subiendo un video que no necesita dividirse -> tiktokMichi.mp4`);
            await filesService.upload(
                fileForTest.originalname,
                fileForTest.mimetype,
                fileForTest.size,
                fileForTest.user,
                fileForTest.extension
            );
            console.log(`Video ttiktokMichi.mp4 subido`)

        }, 300000 // 5 min de timeout
    );

    it('Test 2. Borrar el video que no necesita dividirse',
        async () => {
            try {
                console.log(`Eliminando video tiktokMichi.mp4`);
                await filesService.remove(newFile.id);
                console.log(`Video ${newFile.name} eliminado`);
            } catch (error) {
                fail(`No se pudo borrar un archivo -> ${error}`);

            }
        }
    );

    it('Test 3. Subir un video que si necesita dividirse',
        async () => {
            const fileName = 'Audiencia.mp4'
            const fileForTest = {
                originalname: fileName,
                mimetype: 'video/mp4',
                size: 291134783,
                user,
                extension: '.mp4'
            }

            //copiamos el archivo a la carpeta temporal simulando a multer
            const sourcePath = `./static/videos/${fileName}`;
            const destinationPath = `./filesUploadedTemp/${fileName}`;
            try {
                copyFileSync(sourcePath, destinationPath);
            } catch (error) {
                fail(`Error al copiar archivo ${fileName} -> ${error}`);
            }

            //subimos el video
            console.log(`Subiendo un video que si necesita dividirse -> ${fileName}`);
            await filesService.upload(
                fileForTest.originalname,
                fileForTest.mimetype,
                fileForTest.size,
                fileForTest.user,
                fileForTest.extension
            );
            console.log(`${fileName} subido`)

        }, 300000 // 5 min de timeout
    );

    it('Test 4. Borrar el video que Si necesita dividirse',
        async () => {
            const fileName = 'Audiencia.mp4';
            try {
                console.log(`Eliminando video ${fileName}`);
                await filesService.remove(newFile.id);
                console.log(`Video ${newFile.name} eliminado`);
            } catch (error) {
                fail(`No se pudo borrar ${fileName} -> ${error}`);

            }
        }
    );

    it('Test 5. Subir un pdf',
        async () => {
            const fileName = 'info.pdf';

            const fileForTest = {
                originalname: fileName,
                mimetype: 'application/pdf',
                size: 2779506,
                user,
                extension: '.pdf'
            }

            //copiamos el archivo a la carpeta temporal simulando a multer
            const sourcePath = `./static/pdfs/${fileName}`;
            const destinationPath = `./filesUploadedTemp/${fileName}`;
            try {
                copyFileSync(sourcePath, destinationPath);
            } catch (error) {
                fail(`Error al copiar archivo ${fileName} -> ${error}`);
            }

            //subimos el pdf
            console.log(`Subiendo un pdf ${fileName}`);
            await filesService.upload(
                fileForTest.originalname,
                fileForTest.mimetype,
                fileForTest.size,
                fileForTest.user,
                fileForTest.extension
            );
            console.log(`${fileName} subido`);

        }
    );

    it('Test 6. Borrar el pdf que no necesita dividirse',
        async () => {
            const fileName = 'info.pdf';
            try {
                console.log(`Eliminando ${fileName}`);
                await filesService.remove(newFile.id);
                console.log(`${newFile.name} eliminado`);
            } catch (error) {
                fail(`No se pudo borrar ${fileName} -> ${error}`);

            }
        }
    );

    it('Test 7. Vemos todos los archivos del usuario',
        async () => {
            try {
                const files = await filesService.getAllFilesFromOneUser(user);
                newFile = files[0];
                console.log({ files });

            } catch (error) {
                fail(`NO fue posible obtener los archivos del usuario ${user.fullname} -> ${error}`);
            }
        }
    );
});