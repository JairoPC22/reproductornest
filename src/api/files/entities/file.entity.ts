import { User } from "../../../api/auth/entities/user.entity";
import { Tenant } from "../../../api/tenants/entities/tenant.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    OneToOne,
    UpdateDateColumn
} from "typeorm";
import { FileSegment } from "./FileSegment.entity";
import { GeminiCacheMetadata } from "../../../common/entities/GeminiCacheMetadata.entity";
import { LegalCase } from "../../../api/legal-cases/entities/legal-case.entity";

@Entity('Files')
export class File {

    @Column('uuid', { primary: true })
    id: string;

    @Column('text', { default: "", nullable: false })
    name: string;

    @Column('text', { nullable: false, default: "" })
    file_type: string; //video, pdf, etc


    @Column('text', { nullable: false })
    mimetype: string;

    @Column('bigint', { nullable: false })
    size_bytes: bigint;

    @Column('text', { nullable: false })
    aws_s3_key: string;

    @Column('text', { nullable: false })
    aws_s3_bucket: string;

    @Column('boolean', { nullable: false, default: false })
    is_split: boolean;

    @Column('int', { nullable: true })
    total_segments: number;

    @Column('text', { nullable: false })
    extension: string;

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

    @Column('boolean', { nullable: true })
    cache_is_possible: boolean;

    @OneToMany(
        () => FileSegment,
        (fileSegment) => fileSegment.parent_file_id,
        {
            cascade: true, //Las operaciones (insert, update, remove) que hagas en el User se propagarán automáticamente a sus Files asociados.Efecto: Si guardas un User con nuevos Files, estos se guardarán automáticamente. Si borras un User, podrías borrar sus Files (depende de onDelete en la relación inversa).
            eager: false //El eager carga los datos de files en consultas
        }
    )
    file_segments: FileSegment[]

    @ManyToOne(
        () => User,
        (user) => user.files,
        { onDelete: 'CASCADE' }
    )
    user: User;

    @ManyToOne(
        () => Tenant,
        (tenant) => tenant.files,
        { onDelete: 'CASCADE' } // Cuando se elimine el Tenant (el lado "uno" de la relación), todos los Users relacionados (el lado "muchos") serán eliminados automáticamente.
    )
    tenant: Tenant

    /**Relación uno a uno con Gemini Cache Metadata*/
    @OneToOne(() => GeminiCacheMetadata, geminiCache => geminiCache.file)
    geminiCache: GeminiCacheMetadata

    @ManyToOne(
        () => LegalCase,
        (legalCase) => legalCase.files,
        { onDelete: 'CASCADE' }
    )
    legalCase: LegalCase;

}