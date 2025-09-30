import { Module } from '@nestjs/common';
import { AuthModule } from './api/auth/auth.module';
import { StatusModule } from './api/status/status.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './api/tenants/tenants.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './api/users/users.module';
import { FilesModule } from './api/files/files.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GeminiModule } from './modules/gemini/gemini.module';
import { IaFunctionsModule } from './api/ia-functions/ia-functions.module';
// import { SandboxModule } from './sandbox/sandbox.module';
import { WsVideoFunctionsModule } from './ws/wsVideoFunction/wsVideoFunction.module';
// import { QuestionsVideoModule } from './ws/questions-video/questions-video.module';
import { SplitVideoModule } from './modules/split-video/split-video.module';
import { LegalCasesModule } from './api/legal-cases/legal-cases.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ssl: process.env.STAGE === 'prod' ? true : false,
      extra: {
        ssl: process.env.STAGE === 'prod'
          ? { rejectUnauthorized: false }
          : null
      },
      type: 'postgres',
      database: process.env.PGDATABASE,
      host: process.env.PGHOST,
      port: +process.env.PGPORT!,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      // schema: 'AureoSystems',
      autoLoadEntities: true,
      synchronize: true
      // synchronize: process.env.STAGE === 'prod' ? false : true, //set true only for dev mode,

    }),
    MongooseModule.forRoot(process.env.MONGO_URL!,
      {
        dbName: process.env.MONGODB_DATABASE_NAME,
      }
    ),
    AuthModule,
    StatusModule,
    TenantsModule,
    CommonModule,
    UsersModule,
    FilesModule,
    GeminiModule,
    IaFunctionsModule,
    // SandboxModule,
    SplitVideoModule,
    WsVideoFunctionsModule,
    LegalCasesModule,
    // QuestionsVideoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
