import { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import config from '../config';

const baseFolder = config.isProduction ? 'dist' : 'src';

const typeormConfig = {
  type: config.MYSQL_CONNECTION,
  host: config.MYSQL_HOST,
  port: config.MYSQL_PORT,
  username: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.MYSQL_DB,
  namingStrategy: new SnakeNamingStrategy(),
  logging: true,
  // synchronize: true, // TODO: Make true on development
  entities: [`${baseFolder}/model/*{.js,.ts}`, `${baseFolder}/model/views/*{.js,.ts}`],
  migrations: [`${baseFolder}/database/migration/**/*{.js,.ts}`],
  subscribers: [`${baseFolder}/database/subscriber/**/*{.js,.ts}`],
  cli: {
    entitiesDir: `${baseFolder}/model`,
    migrationsDir: `${baseFolder}/database/migration`,
    subscribersDir: `${baseFolder}/database/subscriber`,
  },
  cache: {
    type: 'ioredis',
    duration: config.CACHE_DURATION_IN_MS,
    alwaysEnabled: true,
    options: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    },
    ignoreErrors: true,
  },
} as ConnectionOptions;

export default typeormConfig;
