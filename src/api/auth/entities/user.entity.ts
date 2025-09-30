import { LegalCase } from "../../../api/legal-cases/entities/legal-case.entity";
import { File } from "../../../api/files/entities/file.entity";
import { Tenant } from "../../../api/tenants/entities/tenant.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('Users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    email: string;

    @Column('text', { select: false }) //Para que no se seleccione con el findOne
    pass: string;

    @Column('text')
    fullname: string;

    @Column('bool', { default: true })
    isActive: boolean;

    @Column('text', { array: true, default: ['consultor'] }) //['adminTenant' 'adminFiles' 'consultor']
    roles: string[];

    @Column('text', { array: true, default: [] })//['addUser' 'deleteUser' 'addFiles' 'deleteFiles']
    permisos: string[];

    @ManyToOne(
        () => Tenant,
        (tenant) => tenant.users,
        { onDelete: 'CASCADE', eager: true } //Si se elimina el Tenant el usuario tambien se elimina, 
        //si el usuario se borra, el tenant NO se elimina
    )
    tenant: Tenant;


    @OneToMany(
        () => File,
        (file) => file.user,
        {
            cascade: true,
            eager: false //El eager carga los datos de files en consultas
        }
    )
    files: File[]

    @OneToMany(
        () => LegalCase,
        (legalCase) => legalCase.user,
        {
            cascade: true,
            eager: false //El eager carga los datos de files en consultas
        }
    )
    legalCases: LegalCase[]

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert()
    }
}
