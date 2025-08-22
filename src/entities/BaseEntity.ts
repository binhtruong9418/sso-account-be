import {type Opt, PrimaryKey, Property, BaseEntity as MikrormBaseEntity} from "@mikro-orm/core";


export abstract class BaseEntity extends MikrormBaseEntity {
  @PrimaryKey({type: 'bigint'})
  id!: number;

  @Property()
  createdAt: Date & Opt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date & Opt = new Date();
}