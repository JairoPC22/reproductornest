import {
  Controller, Post, Body
} from '@nestjs/common';
import { IaFunctionsService } from './ia-functions.service';
import { IaVideoFunctionDto } from './dto/create-ia-function.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam
} from '@nestjs/swagger';

@Controller('ia-functions')
export class IaFunctionsController {
  constructor(private readonly iaFunctionsService: IaFunctionsService) { }

  @ApiOperation({ summary: 'Obtiene la transcripción o resumen de un video' })
  @ApiCreatedResponse({
    description: 'Devuelve la transcripción/resumen del video en texto en formato markdown',
    content: {
      'text/plain': {
        example: '**Este es el resumen generado por IA... **'
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'El body de la petición está mal formado',
    example: {
      statusCode: 400,
      message: 'fileId must be a UUID',
      error: 'Bad request',
    }
  })
  @ApiNotFoundResponse({
    description: 'Video not found',
    example: {
      statusCode: 404,
      message: 'Video not found',
      error: 'Not found',
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      S3Error: {
        summary: 'Error de conexion con S3',
        value: {
          statusCode: 500,
          message: 'Ocurrió un error al procesar el video',
          error: 'Internal Server Error',
        }
      },
      GeminiError: {
        summary: 'Error con Gemini',
        value: {
          statusCode: 500,
          message: 'error',
          error: 'Internal Server Error',
        }
      }
    }
  })
  @Post('video')
  analizeVideo(@Body() iaVideoFunctionDto: IaVideoFunctionDto) {
    return this.iaFunctionsService.analizeVideoAndReturnIaReponseText(iaVideoFunctionDto);
  }

}
