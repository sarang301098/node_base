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
  logging: ['error'],
  dropSchema: config.isTest,
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
