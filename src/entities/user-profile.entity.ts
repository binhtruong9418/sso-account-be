import {Entity, OneToOne, Property} from "@mikro-orm/postgresql";
import {User} from "./user.entity";
import {BaseEntity} from "./BaseEntity";

@Entity()
export class UserProfile extends BaseEntity {
    @Property({nullable: true})
    fullName?: string;

    @Property({nullable: true})
    avatarUrl?: string;

    @Property({type: "bigint"})
    userId!: number;
}