import { Controller, Post, Res, Delete, Param, ParseUUIDPipe, Get, Logger, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiUnauthorizedResponse, ApiConsumes, ApiBody, ApiParam, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { FilesService } from './files.service';
import { ValidPermisos } from '../../common/interfaces/valid-permisos.enum';
import { CheckPermissions } from '../auth/decorators/permission.decorator';
import { fileFilter } from './helpers/fileFilter.helper';
import { ValidMimeTypes } from '../../common/interfaces/valid-mimetypes.enum';

@Controller('files')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Unauthorized: There is not a token or the token is not valid' })
export class FilesController {
  private readonly s3CLient: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger('files.controller');
  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FilesService
  ) {


    this.s3CLient = new S3Client({
      region: this.configService.get('AWS_BUCKET_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')!
      }
    })

    this.bucketName = configService.get('AWS_BUCKET_NAME')!;

    //Creamos la carpeta temporal donde se almacenarán los archivos
    if (!existsSync('./filesUploadedTemp'))
      mkdirSync('./filesUploadedTemp', { recursive: true })
  }


  @Post('uploadOne/:legalCaseId')
  @Auth()
  @CheckPermissions(ValidPermisos.uploadFiles)
  @ApiOperation({ summary: 'Guarda un archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF o MP4',
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'File was uploaded successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'File uploaded successfully' },
        fileId: { type: 'string', example: '186b7229-42c2-45b2-92f3-87eef03e9291.pdf' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'MimeType of the file is not allowed (only pdf and mp4 are allowed)' })
  @ApiInternalServerErrorResponse({ description: 'There was an error when saving into DB or AWS-S3' })
  @ApiParam({
    name: 'legalCaseId',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'UUID del caso legal al que esta relacionado el archivo',
    example: '3da47b33-7b40-4265-b7f9-55e9cbd59251'
  })
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    storage: diskStorage({
      destination: './filesUploadedTemp',
      filename: (req: Request, file: Express.Multer.File, callback: Function) => { callback(null, file.originalname) }
    })
  }))
  async uploadOneFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
    @Param('legalCaseId', ParseUUIDPipe) legalCaseId: string
  ) {
    if (!file) throw new BadRequestException(`Mime types allowed are ${Object.values(ValidMimeTypes)}`);
    console.log({ file })
    await this.fileService.upload(
      file.originalname,
      file.mimetype,
      file.size,
      user,
      `.${file.mimetype.split('/')[1]}`, //extensión del archivo
      legalCaseId
    );



  }
  /**
   * El archivo de UploadedFile luce así:
   * "file": {
   *     "fieldname": "file",
   *     "originalname": "tiktokMichi.mp4",
   *     "encoding": "7bit",
   *     "mimetype": "video/mp4",
   *     "destination": "./filesUploadedTemp",
   *     "filename": "tiktokMichi.mp4",
   *     "path": "filesUploadedTemp/tiktokMichi.mp4",
   *     "size": 3059255
   * }
   */
  /** uploadOne response looks like:
   * {
   *     "message": "File uploaded successfully",
   *     "archivo": "2f71d3b4-4f03-406f-8e25-d8366900e9ea.pdf"
   * }
   */

  @Delete('delete/:id')
  @Auth()
  @CheckPermissions(ValidPermisos.deleteFiles)
  @ApiOperation({ summary: 'Elimina un archivo por ID' })
  @ApiOkResponse({ description: 'The file was successfully deleted' })
  @ApiNotFoundResponse({ description: 'File not found' })
  @ApiInternalServerErrorResponse({ description: 'Error deleting object from DB or AWS-S3' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'UUID del archivo a eliminar sin extension (.pdf, .mp4)',
    example: '3da47b33-7b40-4265-b7f9-55e9cbd59251'
  })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fileService.remove(id);

  }

  @Get('getOne/:id')
  @Auth()
  @ApiOperation({ summary: 'Obtiene un archivo por ID y extensión' })
  @ApiOkResponse({
    description: 'Returns the requested file as a stream',
  })
  @ApiNotFoundResponse({ description: 'File not found' })
  @ApiParam({
    name: 'id',
    type: 'string',
    required: true,
    description: 'UUID del archivo con extensión (.pdf, .mp4)',
    example: '3da47b33-7b40-4265-b7f9-55e9cbd59251.pdf'
  })
  async findOne(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    if (! await this.fileService.fileExists(id))
      res.status(404).json('File not found');

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: id
      })
      const response = await this.s3CLient.send(command);
      (response.Body as NodeJS.ReadableStream).pipe(res)
    } catch (error) {
      this.logger.error(error);
      res.status(500).json('Error getting the object. Please check server errors');
    }
  }

  @Get('getAll')
  @Auth()
  @ApiOperation({
    summary: 'Obtiene todos los archivos de un usuario',
    description: 'El usuario se identifica por medio del token y se devuelven todos sus archivos relacionados'
  })
  @ApiOkResponse({
    schema: {
      properties: {
        id: { type: 'uuid', example: '3da47b33-7b40-4265-b7f9-55e9cbd59251' },
        name: { type: 'string', example: 'file.pdf' },
        mimetype: { type: 'string', example: 'application/pdf' },
        size_bytes: { type: 'string', example: '417689' }
      }
    }
  })
  @ApiInternalServerErrorResponse({ description: 'There was a problem getting info' })
  async findAll(@GetUser() user: User) {
    return this.fileService.getAllFilesFromOneUser(user);
  }


}
