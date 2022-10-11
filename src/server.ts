import 'reflect-metadata';

import { RedisService } from './service/redis';
import logger from './service/log';
import Database from './database';
import app from './app';
import { Cron } from './service/Cron';

const database = new Database();
const redisService = new RedisService();

const port = app.get('port');

(async function () {
  try {
    await database.connect();
    try {
      new Cron().execute();
    } catch (error) {
      logger.error('Error in cron', error);
    }
    app.listen(port, () => {
      logger.info(`Server started - PORT: ${port}`);
      process.send && process.send('ready');
    });
  } catch (error) {
    logger.error('Unable to connect to database. ', error);
    process.stdin.emit('SIGINT');
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  logger.info('Gracefully shutting down');
  await database.disConnect();
  redisService.disconnect();
  process.exit(0);
});
