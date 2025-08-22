import {EntityManager, EntityRepository, MikroORM, Options} from "@mikro-orm/postgresql";
import {User} from "./entities/user.entity";
import config from './mikro-orm.config'
import {ClientApplication} from "./entities/client-application.entity";
import {UserProfile} from "./entities/user-profile.entity";

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  user: EntityRepository<User>;
  clientApplication: EntityRepository<ClientApplication>;
  userProfile: EntityRepository<UserProfile>
}

let dataSource: Services;

// Initialize the ORM then return the data source this will use data source as a cache so call multiple times will not reinitialize the ORM
export async function initORM(options?: Options): Promise<Services> {
  if (dataSource) return dataSource;
  // allow overriding config options for testing
  const orm = await MikroORM.init({
    ...config,
    ...options,
  });

  // save to cache before returning
  dataSource = {
    orm,
    em: orm.em,
    user: orm.em.getRepository(User),
    clientApplication: orm.em.getRepository(ClientApplication),
    userProfile: orm.em.getRepository(UserProfile),
  };
  return dataSource;
}
