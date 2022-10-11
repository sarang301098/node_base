import { join } from 'path';
import { ConnectionOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import config from '../config';
import { IDatabaseConfig, parse } from './parseConnectionString';

export const DB_URL = config.TEST_DATABASE_URL;

export const databaseConfigs = (): IDatabaseConfig => parse(DB_URL);

export const dbConnectionOptions = (): ConnectionOptions => {
  const { username, password, host, port, database, dialect } = databaseConfigs();
  const entityPath = join(__dirname, '..', 'model/*{.js,.ts}');
  const options = {
    type: dialect,
    host,
    port,
    username,
    password,
    database,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [entityPath],
  } as ConnectionOptions;
  return options;
};
