import { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import config from '../config';

const baseFolder = config.isProd ? 'dist' : 'src';

const typeormConfig = {
  type: config.POSTGRES_CONNECTION,
  host: config.POSTGRES_HOST,
  port: config.POSTGRES_PORT,
  username: config.POSTGRES_USER,
  password: config.POSTGRES_PASSWORD,
  database: config.POSTGRES_DB,
  synchronize: false, // TODO: Make true on development
  logging: ['error'],
  dropSchema: false, // TODO: Make true on test
  namingStrategy: new SnakeNamingStrategy(),
  // TODO: https://github.com/typeorm/typeorm/issues/5252
  migrationsTransactionMode: 'each',
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
