import {Entity, ManyToOne, Property, Unique} from "@mikro-orm/postgresql";
import {BaseEntity} from "./BaseEntity";
import {User} from "./user.entity";

@Entity()
export class ClientApplication extends BaseEntity {
    constructor() {
        super();
    }

    @Property()
    name!: string;

    @Property({nullable: true, type: "text"})
    description?: string;

    @Property()
    @Unique()
    clientId!: string;

    @Property({lazy: true})
    clientSecret!: string;

    @Property()
    redirectUri!: string;

    @ManyToOne(() => User, {nullable: true})
    owner?: User;
}