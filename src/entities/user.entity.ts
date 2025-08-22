import {BaseEntity} from "./BaseEntity";
import {Collection, Entity, Enum, OneToMany, OneToOne, Property, Unique} from "@mikro-orm/postgresql";
import {AppRole} from "../core/types/types";

@Entity()
export class User extends BaseEntity {
    constructor() {
        super();
    }

    @Property()
    @Unique()
    email!: string;

    @Property({lazy: true})
    password!: string;

    @Enum({
        default: AppRole.USER,
        items: () => AppRole,
    })
    role!: AppRole;
}