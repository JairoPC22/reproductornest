import { LegalCase } from "../../../api/legal-cases/entities/legal-case.entity";
import { User } from "../../../api/auth/entities/user.entity";
import { File } from "../../../api/files/entities/file.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('Tenants')
export class Tenant {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column('text', { unique: true })
    nameTenant: string;

    @Column('text', { unique: true })
    slug: string;

    @Column('bool', { default: true })
    isActive: boolean;

    @OneToMany(
        () => User,
        (user) => user.tenant,
        {
            cascade: true, //inserta o elimina en cascada los usuarios del tenant
            eager: false // no muestra las relaciones en automático cuando consultamos la db con find
        }
    )
    users: User[];

    @OneToMany(
        () => File,
        (file) => file.tenant,
        {
            cascade: true,
            eager: false
        }
    )
    files: File[];

    @OneToMany(
        () => LegalCase,
        (legalCase) => legalCase.tenant,
        {
            cascade: true,
            eager: false
        }
    )
    legalCases: LegalCase[];

}
