import { File } from "../../api/files/entities/file.entity";
import { FileSegment } from "../../api/files/entities/FileSegment.entity";
import { Column, Entity, Generated, JoinColumn, OneToOne } from "typeorm";

@Entity('GeminiFileMetadata')
export class GeminiFileMetadata {

    @Column('uuid', { primary: true })
    @Generated('uuid')
    id: string;

    /**Opcional. NUll si está almacenando el cache de un segmento  */
    @OneToOne(() => File, file => file.geminiCache, { cascade: true, nullable: true, onDelete: 'CASCADE' })
    @JoinColumn()
    file: File;

    /**Opcional. NUll si está almacenando el cache de un archivo no segmentado  */
    @OneToOne(() => File, file => file.geminiCache, { cascade: true, nullable: true, onDelete: 'CASCADE' })
    @JoinColumn()
    fileSegment: FileSegment;

    @Column('text', { nullable: false })
    name: string;

    @Column('text', { nullable: false })
    displayName: string;

    @Column('text', { nullable: false })
    mimeType: string;

    @Column('bigint', { nullable: false })
    sizeBytes: bigint;

    @Column('timestamp', { nullable: false })
    createTime: Date;

    @Column('timestamp', { nullable: false })
    updateTime: Date;

    @Column('timestamp', { nullable: false })
    expirationTime: Date;

    @Column('text', { nullable: false })
    sha256Hash: string;

    @Column('text', { nullable: false })
    uri: string;

    @Column('text', { nullable: false })
    state: string;

    @Column('text', { nullable: false })
    source: string;
    
}