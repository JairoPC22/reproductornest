import { Expose, Type } from "class-transformer";

/**Dtos para definir que información del caso y de los archivos del caso se le 
 * devualve al frontend en el método 'findOne' de legal-cases.service.ts
 */

export class FileResponseDto {
    @Expose()
    id: string;

    @Expose()
    name: string;

    @Expose()
    file_type: string;

    @Expose()
    extension: string;

    @Expose()
    mimetype: string;

    @Expose()
    size_bytes: bigint;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;
}

export class LegalCaseResponseDto {

    @Expose()
    id: string;

    @Expose()
    title: string;

    @Expose()
    caseSummary: string;

    @Expose()
    created_at: Date;

    @Expose()
    updated_at: Date;

    @Expose()
    description: string;

    @Expose()
    @Type(() => FileResponseDto)
    files: FileResponseDto[];
    
}