import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToOne,
    UpdateDateColumn
} from "typeorm";
import { File } from "./file.entity";
import { GeminiCacheMetadata } from "../../../common/entities/GeminiCacheMetadata.entity";

@Entity('File_Segments')
export class FileSegment {

    @Column('uuid', { primary: true })
    id: string;

    @ManyToOne(
        () => File,
        (file) => file.file_segments,
        { onDelete: 'CASCADE' }
    )
    parent_file_id: File;

    @Column('int', { nullable: false })
    segment_number: number; //cuenta desde 0

    @Column('text', { nullable: false })
    name: string; //Nombre del segmento (ej: segment_000.mp4)

    @Column('int', { nullable: false })
    size_bytes: number;

    @Column('text', { nullable: false })
    aws_s3_key: string;

    @Column('text', { nullable: false })
    aws_s3_bucket: string;

    //TODO:
    // @Column('float', { nullable: true })
    // time_start_seconds: number; //solo para videos

    // @Column('float', { nullable: true })
    // time_end_seconds: number; //solo para videos

    // @Column('float', { nullable: true })
    // duration_seconds: number;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)'
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)'
    })
    updated_at: Date;

    @Column('text', { nullable: false, default: null })
    extension: string;

    @Column('boolean', { nullable: true, default: null })
    cache_is_possible: boolean;

    /**Relación uno a uno con Gemini Cache Metadata*/
    @OneToOne(() => GeminiCacheMetadata, geminiCache => geminiCache.fileSegment)
    geminiCache: GeminiCacheMetadata

}