import { ConnectionOptions } from 'typeorm';

import config from '../config';

const baseFolder = config.isProd ? 'dist' : 'src';

const mongoDbTypeorm = {
  name: 'mongodb',
  type: config.MONGODB_CONNECTION,
  host: config.MONGODB_HOST,
  port: config.MONGODB_PORT,
  username: config.MONGODB_USERNAME, // TODO: Remove in development.
  password: config.MONGODB_PASSWORD, // TODO: Remove in development.
  database: config.MONGODB_DATABASE,
  entities: [`${baseFolder}/model/mongo/**/*{.js,.ts}`],
  useUnifiedTopology: true,
  useNewUrlParser: true,
  authSource: 'admin',
  synchronize: true,
  logging: false,
} as ConnectionOptions;

export default mongoDbTypeorm;
