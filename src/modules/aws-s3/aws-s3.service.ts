import {
    DeleteObjectCommand,
    GetObjectCommand,
    NoSuchKey,
    PutObjectCommand,
    S3Client,
    S3ServiceException,
} from "@aws-sdk/client-s3";
import { S3Credentials } from "./interfaces/s3-credentials.interface";
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { pipeline, Readable } from "stream";
import { createReadStream, createWriteStream, PathLike, rm } from "fs";

@Injectable()
export class AwsS3Service {
    private s3: S3Client;
    private bucketName: string;
    private readonly logger: Logger = new Logger('aws-s3.service');

    constructor(params: S3Credentials, bucketName: string) {
        this.s3 = new S3Client(params);
        this.bucketName = bucketName;
    }

    async getBlobFromS3(Key: string, mimeType: string): Promise<Blob> {
        try {
            const response = await this.s3.send(
                new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key
                })
            );
            // if (tranformBody) return await response.Body?.transformToString
            const stream = response.Body as Readable;
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk as Buffer);
            }
            const buffer = Buffer.concat(chunks);
            return new Blob([buffer], { type: mimeType })

        } catch (error) {
            this.logger.error(`Error in 'getBlobFromS3' -> ${error}`);
            throw error; //Mirar hasta abajo de la clase para ver todos los posibles errores que se pueden lanzar aquí
        }

    }

    //Hasta 5 GB
    async uploadFileToS3(Key: string, pathFile: string, bucket_name: string | undefined = undefined) {
        try {
            const fileStream = createReadStream(pathFile)
            await this.s3.send(new PutObjectCommand({
                Bucket: bucket_name ? bucket_name : this.bucketName,
                Key,
                Body: fileStream
            }));

        } catch (caught) {
            if (
                caught instanceof S3ServiceException &&
                caught.name === "EntityTooLarge"
            ) {
                this.logger.error(
                    `Error in 'uploadFileToS3'. Error from S3 while uploading object \
The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
or the multipart upload API (5TB max).`,
                );
            } else if (caught instanceof S3ServiceException) {
                this.logger.error(
                    `Error in 'uploadFileToS3. Error from S3 while uploading object.  ${caught.name}: ${caught.message}`,
                );
            } else {
                this.logger.error(`Error in 'uploadFileToS3' ->${caught}`,);
            }

            throw caught;
        }

    }

    /**Descarga un archivo de s3. Recibe el Key del s3 y un path que incluya el nombre del archivo y su extensión para guardar el archivo de s3 */
    async getObject(Key: string, pathToSaveFileStreamable: string): Promise<void> {
        const fileStream = createWriteStream(pathToSaveFileStreamable);
        try {
            const response = await this.s3.send(
                new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key
                })
            );
            // pipeline(response.Body as Readable, fileStream);
            await new Promise((resolve, reject) => {
                pipeline(response.Body as Readable, fileStream, (err) => {
                    if (err) {
                        fileStream.destroy();
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });

        } catch (error) {

            fileStream.destroy(); //Aseguramos la limpieza

            if (error instanceof NoSuchKey) {
                this.logger.error(`Error in 'getObject'. Error from S3 while getting object "${Key}" from "${this.bucketName}". No such key exists.`,);
            } else if (error instanceof S3ServiceException) {
                this.logger.error(`Error in 'getObject'. Error from S3 while getting object from ${this.bucketName}.  ${error.name}: ${error.message}`,)

            } else if (error.code === 'ENOENT' || error.code === 'EACCES') {
                //Errores de filesystem
                this.logger.error(`Error in 'getObject'. Filesystem error while downloading S3 object: ${error.message}`);
            } else {
                this.logger.error(`Error i 'getObject'. Failed to download file from s3: -> ${error} `);
            }

            throw error
        }
    }

    async delete(Key: string) {
        //Borramos en el S3
        try {
            //TODO: Verificar que si exista el objeto antes de eliminarlo.
            //Esto porque por ahora siempre regresa un 204, ya sea que se elimino o que el objeto en Key no existía
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key
            })
            await this.s3.send(command);

        } catch (error) {
            if (error instanceof S3ServiceException && error.name === 'NoSuchBucket') {
                this.logger.error(`Error from S3 while deleting object from ${this.bucketName}. The bucket doesn't exist.`);
            } else if (error instanceof S3ServiceException) {
                this.logger.error(`Error from S3 while deleting object from ${this.bucketName}.  ${error.name}: ${error.message}`);
            } else {
                this.logger.error(`Error i 'delete'. Failed delete file in s3: -> ${error} `);
            }
            throw error;
        }
    }



}

/**
 * Errores comunes de S3 que deberías manejar:
 * Errores específicos de objetos:
 * - NoSuchKey: El objeto no existe
 * - InvalidObjectName: Nombre de objeto inválido
 * - ObjectNotInActiveTierError: Objeto en tier de almacenamiento incorrecto
 * Errores de bucket:
 * - NoSuchBucket: El bucket no existe
 * - BucketAlreadyExists: El bucket ya existe
 * - InvalidBucketName: Nombre de bucket inválido
 * Errores de acceso:
 * - AccessDenied: Sin permisos
 * - SignatureDoesNotMatch: Credenciales incorrectas
 * - TokenRefreshRequired: Token expirado
 * Errores de operación:
 * - EntityTooLarge: Archivo muy grande
 * - RequestTimeout: Timeout en la petición
 * - SlowDown: Demasiadas peticiones (throttling)
 */