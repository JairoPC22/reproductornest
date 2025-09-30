import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Si necesitas enviar cookies/autenticación
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //Solo recibo data en mi dto
      forbidNonWhitelisted:true, //Si viene basura fuera del dto regresa bad request
      transformOptions: {
        exposeUnsetFields: false,
        enableImplicitConversion: true //convierte en automático el tipo de dato especificado en el dto
      },
      transform: true,
    })
  );

   const config = new DocumentBuilder()
    .setTitle('Dacuai RESTFull API')
    .setDescription('Endpoints del backend de la aplicación Dacuai')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token'
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);


  await app.listen(process.env.PORT ?? 3000);
  logger.log(`App running on port ${process.env.PORT ?? 3000}`)
}
bootstrap();
