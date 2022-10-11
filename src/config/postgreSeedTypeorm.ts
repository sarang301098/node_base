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
  dropSchema: config.isTest,
  namingStrategy: new SnakeNamingStrategy(),
  migrationsTableName: 'seed',
  migrationsTransactionMode: 'each',
  entities: [`${baseFolder}/model/*{.js,.ts}`],
  migrations: [`${baseFolder}/database/seed/*{.js,.ts}`],
  subscribers: [`${baseFolder}/database/subscriber/**/*{.js,.ts}`],
  cli: {
    entitiesDir: `${baseFolder}/model`,
    migrationsDir: `${baseFolder}/database/seed`,
    subscribersDir: `${baseFolder}/database/subscriber`,
  },
} as ConnectionOptions;

export default typeormConfig;
