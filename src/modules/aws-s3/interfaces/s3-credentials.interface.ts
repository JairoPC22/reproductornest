export interface S3Credentials {
    region: string,
    credentials: {
        accessKeyId: string,
        secretAccessKey: string
    }
}