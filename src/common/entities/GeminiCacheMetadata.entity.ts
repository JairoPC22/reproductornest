import { File } from "../../api/files/entities/file.entity";
import { FileSegment } from "../../api/files/entities/FileSegment.entity";
import { Column, Entity, Generated, JoinColumn, OneToOne } from "typeorm";

@Entity('GeminiCacheMetadata')
export class GeminiCacheMetadata {

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
    model: string;

    @Column('timestamp', { nullable: false })
    createTime: Date;

    @Column('timestamp', { nullable: false })
    updateTime: Date;

    @Column('timestamp', { nullable: false })
    expireTime: Date;

    @Column('jsonb', { nullable: false })
    usageMetadata: {
        totalTokenCount: number;
        [key: string]: any; //Para flexibilidad futura
    }
}