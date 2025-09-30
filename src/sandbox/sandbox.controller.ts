import { Controller, Post, Body} from '@nestjs/common';
import { SandboxService } from './sandbox.service';
import { IaVideoFunctionDto } from 'src/api/ia-functions/dto/create-ia-function.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('sandbox')
@ApiTags('Sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) { }

  @ApiOperation({
    summary: 'Obtiene la transcripción o resumen de un video.',
    description: 'No devuelve resultados reales, unicamente es un sandbox para hacer pruebas'
  })
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
  @Post('ia-functions/video')
  analizeVideo(@Body() iaVideoFunctionDto: IaVideoFunctionDto) {
    return this.sandboxService.videoIaSandbox(iaVideoFunctionDto);
  }

}
