import { Tenant } from "../../tenants/entities/tenant.entity";
import { User } from "../../auth/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { File } from "../../files/entities/file.entity";

@Entity('Legal_Cases')
export class LegalCase {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(
        () => User,
        (user) => user.legalCases,
        { onDelete: 'CASCADE' }
    )
    user: User;

    @ManyToOne(
        () => Tenant,
        (tenant) => tenant.legalCases,
        { onDelete: 'CASCADE' }
    )
    tenant: Tenant;

    @Column('text', { default: 'untitled' })
    title: string;

    @Column('text', { nullable: true })
    caseSummary: string;

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

    @Column('text', { nullable: true })
    description: string;

    // @UpdateDateColumn()
    // reviewed_at: Date;
    /**
     * UpdateDateColumn: Hace que se actualize de forma autocamtico en cualquier cambio.
     * También te permite actualizar de forma manual:  case.reviewed_at = new Date();
     */

    @OneToMany(
        () => File,
        (file) => file.legalCase,
        {
            cascade: true,
            eager: false //El eager carga los datos de files en consultas
        }
    )
    files: File[]





}