import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { existsSync, mkdirSync, readdirSync, rm, rmSync, statSync } from 'fs';
import { DeleteObjectCommand, S3Client, S3ServiceException } from '@aws-sdk/client-s3';

import { AwsS3Service } from '../../modules/aws-s3/aws-s3.service';
import { File } from './entities/file.entity';
import { User } from '../../api/auth/entities/user.entity';
import { v4 as uuid } from 'uuid';
import { join } from 'path';
import { SplitVideoService } from '../../modules/split-video/split-video.service';
import { FileSegment } from './entities/FileSegment.entity';
import { filesFromOneUser } from './interfaces/filesFromOneUser.interface';

@Injectable()
export class FilesService {

    private readonly logger = new Logger('file.service');
    private readonly s3: S3Client;
    private readonly bucketName: string;

    constructor(
        //Repositories
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(FileSegment)
        private readonly fileSegmentRepository: Repository<FileSegment>,
        private readonly dataSource: DataSource,

        //Config Modules
        private readonly configService: ConfigService,

        //tools modules
        private readonly awsService: AwsS3Service,
        private readonly splitVideo: SplitVideoService

    ) {

        this.bucketName = this.configService.get('AWS_BUCKET_NAME')!
        this.s3 = new S3Client({
            region: this.configService.get('AWS_BUCKET_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID')!,
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')!,
            }
        });
    }

    //UPLOAD FILES FUNCTIONS

    /**Función principal para recibir y subir cualquier tipo de archivo */
    async upload(originalname: string, mimetype: string, size: number, user: User, extension: string, legalCaseId: string): Promise<void> {
        const id = uuid();
        switch (extension) {
            case '.mp4':
                await this.uploadOneVideo(
                    id,
                    originalname,
                    mimetype,
                    size,
                    user,
                    extension,
                    legalCaseId
                );
                break;

            default:
                //uploadOneFile sirve para subir cualquier tipo de archivo.
                //Siempre y cuando no tenga que dividirse en segmentos
                await this.uploadOneFile(
                    id,
                    extension,
                    originalname,
                    mimetype,
                    user,
                    size,
                    extension.split('.')[1], //file_type
                    legalCaseId
                );
                break;
        }
    }

    /**Sirve para subir un video, ya sea que necesite dividirse o no */
    private async uploadOneVideo(id: string, originalname: string, mimetype: string, size: number, user: User, extension: string, legalCaseId: string) {

        //Decidimos sidividimos el video
        if (size > 1024 * 1024 * 95) { //Mayor a 95 mb
            const fileToSplit = join('./filesUploadedTemp', originalname);
            const folderToSaveVideoParts = join('./filesUploadedTemp', id);
            if (!existsSync(folderToSaveVideoParts)) mkdirSync(folderToSaveVideoParts);
            await this.splitVideo.splitVideo(fileToSplit, folderToSaveVideoParts, 20);

            //obtenemos todos las partes
            const videoParts = readdirSync(folderToSaveVideoParts)
                .sort()// Ordenar alfabéticamente (segment_001, segment_002, etc.)
                .map((file, index) => {
                    const statsVideoSegment = statSync(join(folderToSaveVideoParts, file));
                    const idVideoSegment = uuid()
                    return {
                        id: idVideoSegment,
                        name: `segment_${index}${extension}`,
                        path: join(folderToSaveVideoParts, file),
                        segment_number: index,
                        size_bytes: statsVideoSegment.size,
                        aws_s3_key: `${idVideoSegment}${extension}`,
                        aws_s3_bucket: this.bucketName //TODO: que cada tenant tenga su propio bucket

                    }
                });

            //Añadimos el video principal
            videoParts.push({
                id: id,
                name: originalname,
                path: join('./filesUploadedTemp', originalname),
                segment_number: 999,//no import el numero de segmento porque es el archivo principal
                size_bytes: size,
                aws_s3_key: `${id}${extension}`,
                aws_s3_bucket: this.bucketName
            })

            // Subimos tanto el video completo como los segmentos a s3
            console.log('Subiendotanto el video completo con los segmentos a s3')
            // TODO: Cambiar por un Promise.allsettle
            await Promise.all(
                videoParts.map(async (videoPart) => {
                    await this.awsService.uploadFileToS3(
                        videoPart.aws_s3_key,
                        videoPart.path,
                        videoPart.aws_s3_bucket
                    );
                })
            )
                .then(() => {
                    //borramos los segmentos
                    rm(folderToSaveVideoParts, { recursive: true }, (err) => {
                        if (err) {
                            throw new InternalServerErrorException(err);
                        }
                    });
                    //borramos el archivo principal temporal
                    rm(fileToSplit, { recursive: true }, (err) => {
                        if (err) {
                            throw new InternalServerErrorException(err);
                        }
                    });
                })
                .catch(error => {
                    //borramos los segmentos
                    rm(folderToSaveVideoParts, { recursive: true }, (err) => {
                        if (err) {
                            throw new InternalServerErrorException(err);
                        }
                    });
                    //borramos el archivo principal temporal
                    rm(fileToSplit, { recursive: true }, (err) => {
                        if (err) {
                            throw new InternalServerErrorException(err);
                        }
                    });
                    throw new InternalServerErrorException(error)
                })

            //quitamos el video principal del arreglo de videoParts
            videoParts.pop();

            //Subimos datos a la db
            try {
                const file = this.fileRepository.create({
                    id,
                    user,
                    tenant: user.tenant,
                    name: originalname,
                    file_type: 'video',
                    mimetype,
                    size_bytes: BigInt(size),
                    aws_s3_key: `${id}${extension}`,
                    aws_s3_bucket: this.bucketName,
                    is_split: true,
                    extension,
                    total_segments: videoParts.length,
                    file_segments: videoParts.map(videoSegment => this.fileSegmentRepository.create({
                        id: videoSegment.id,
                        segment_number: videoSegment.segment_number,
                        name: videoSegment.name,
                        size_bytes: videoSegment.size_bytes,
                        aws_s3_key: videoSegment.aws_s3_key,
                        aws_s3_bucket: videoSegment.aws_s3_bucket,
                        extension
                    })),
                    legalCase: { id: legalCaseId }
                })
                await this.fileRepository.save(file);
            } catch (error) {
                this.logger.error(`Los video Segments si se subieron a S3 pero no a la db`);
                throw new InternalServerErrorException(error);
            }


        } else {
            await this.uploadOneFile(id, extension, originalname, mimetype, user, size, 'video', legalCaseId);
        }

    }

    /**Sirve para subir un pdf o un video que no necesite dividirse en segmentos */
    private async uploadOneFile(id: string, extension: string, originalname: string, mimetype: string, user: User, size: number, file_type: string, legalCaseId: string) {

        //Subimos al s3
        const aws_s3_key = `${id}${extension}`;
        const fileToUpload = join(`./filesUploadedTemp`, originalname)
        try {
            await this.awsService.uploadFileToS3(aws_s3_key, fileToUpload, this.bucketName);

        } catch (error) {
            throw new InternalServerErrorException(error);
        }
        finally {
            rmSync(fileToUpload);
        }

        //Subimos a la db
        try {
            const filedb = this.fileRepository.create({
                id,
                user,
                tenant: user.tenant,
                name: originalname,
                file_type,
                mimetype,
                size_bytes: BigInt(size),
                aws_s3_key,
                aws_s3_bucket: this.bucketName,
                is_split: false,
                extension,
                legalCase: { id: legalCaseId }

            })

            await this.fileRepository.save(filedb);

        } catch (error) {
            this.logger.error(`El Archivo si subio a s3 pero no a la db`);
            await this.awsService.delete(aws_s3_key)
            throw new InternalServerErrorException(error);
        }
    }

    //REMOVE FILES FUNCTIONS

    /**Función principal para eliminar cualquier tipo de arhivos */
    async remove(fileId: string): Promise<void> {
        //Buscamos si existe en la db
        const file = await this.fileRepository.preload({ id: fileId });
        if (!file) throw new NotFoundException(`File not found`);
        const { is_split, aws_s3_key } = file;

        //DB
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction()

        //Si el archivo esta dividido en segmentos
        if (is_split) {

            // borramos primero del s3
            const videoSegments = await this.fileSegmentRepository.find({
                where: { parent_file_id: { id: fileId } },
            })

            await Promise.all(
                videoSegments.map(videoSegment => {
                    // const key = `${videoSegment.id}.${extension}`
                    this.awsService.delete(videoSegment.aws_s3_key);
                })
            ).catch(async (error) => {
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                this.logger.error(`NO fue posible borrar los segmentos de s3 -> ${error}`);
                throw new InternalServerErrorException(`Error deleting object, please check server errors`);

            });
            // borramos el video principal
            await this.awsService.delete(aws_s3_key);

            //borramos de la db
            try {
                await queryRunner.manager.delete(File, { id: fileId });

            } catch (error) {
                this.logger.error(error);
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                this.logger.error('NO fue posible borrar en la base de datos pero si se borro del s3');
                throw new InternalServerErrorException(`Error deleting object, please check server errors`);
            }

            //SI el archivo no esta dividido
        } else {
            try {
                await queryRunner.manager.delete(File, { id: fileId });

            } catch (error) {
                this.logger.error(error);
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                this.logger.error('Transaccion detenida por error en db');
                throw new InternalServerErrorException(`Error deleting object, please check server errors`);
            }

            //Borramos del s3
            try {
                //TODO: Verificar que si exista el objeto antes de eliminarlo.
                //Esto porque por ahora siempre regresa un 204, ya sea que se elimino o que el objeto en Key no existía
                // const extenisonFile = mimetype.split('/')[1];
                const command = new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: aws_s3_key
                })
                await this.s3.send(command);
                // await waitUntilObjectNotExists(
                //     { client: this.s3, maxWaitTime: 3 },
                //     { Bucket: this.bucketName, Key: fileId }
                // );

            } catch (error) {
                if (error instanceof S3ServiceException && error.name === 'NoSuchBucket') {
                    this.logger.error(`Error from S3 while deleting object from ${this.bucketName}. The bucket doesn't exist.`);
                } else if (error instanceof S3ServiceException) {
                    this.logger.error(`Error from S3 while deleting object from ${this.bucketName}.  ${error.name}: ${error.message}`);
                }
                await queryRunner.rollbackTransaction();
                await queryRunner.release();
                this.logger.error('Transaccion detenida por error en s3');
                throw new InternalServerErrorException(`Error deleting object, please check server errors`);
            }
        }
        //Terminamos la transacción de la db
        await queryRunner.commitTransaction();
        await queryRunner.release()

    }

    /**Función solo para pruebas en spec, no se usa en prod */
    async removeAllFilesFromOneUser(user: User) {
        const files = await this.fileRepository.find(
            { where: { user: { id: user.id } } }
        );
        if (!files || files.length < 0) {
            throw new Error(`No se encontraron archivos de ${user.fullname}`);
        }
        await Promise.all(files.map(async (file) => {
            await this.remove(file.id);
        }));
    }

    //GET INFORMATION FUNCTIONS

    /**Verifica si un archivo existe. Recibe como parámetro el id con la extensión de un archivo */
    async fileExists(idWithExtension: string): Promise<boolean> {
        const id = idWithExtension.split('.')[0];
        const file = await this.fileRepository.findOneBy({ id });
        if (!file) return false
        return true
    }

    async getAllFilesFromOneUser(user: User): Promise<filesFromOneUser[]> {
        try {
            const files = await this.fileRepository.find({
                where: { user: { id: user.id } },
            })
            return files.map(file => {
                const { id, name, file_type, mimetype, size_bytes, created_at, updated_at, extension } = file;
                return {
                    id,
                    name,
                    file_type,
                    extension,
                    mimetype,
                    size_bytes,
                    created_at,
                    updated_at
                }
            });
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(`It was not possible to get files. Please Check server errors`);
        }
    }

}
