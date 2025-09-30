import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AwsS3Service } from './aws-s3.service';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: AwsS3Service,
            useFactory: (configService: ConfigService) => {
                return new AwsS3Service({
                    region: configService.get('AWS_BUCKET_REGION')!,
                    credentials: {
                        accessKeyId: configService.get('AWS_ACCESS_KEY_ID')!,
                        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY')!
                    },
                },
                configService.get('AWS_BUCKET_NAME')! //bucketName
                )
            },
            inject: [ConfigService]
        }
    ],
    exports: [AwsS3Service]
})
export class AwsS3Module { }
