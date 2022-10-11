import { CronJob } from 'cron';
import logger from './log';
import config from '../config';
import moment from 'moment';
import mysqldump from 'mysqldump';

export class Cron {
  private static instance: Cron;
  constructor() {
    if (Cron.instance instanceof Cron) {
      return Cron.instance;
    }
    Cron.instance = this;
  }

  public async execute(): Promise<void> {
    this.createDBdump();
  }

  private createDBdump() {
    new CronJob(
      '00 00 * * *',
      () => {
        try {
          mysqldump({
            connection: {
              host: config.MYSQL_HOST,
              user: config.MYSQL_USER,
              password: config.MYSQL_PASSWORD,
              database: config.MYSQL_DB,
            },
            dumpToFile: `./dump/propane_bros_database-${moment().format('YYYY-MM-DD')}.sql`,
          });
        } catch (error) {
          logger.error('Error in Dumping the DB');
        }
      },
      null,
      true,
      'America/New_York',
    ).start();
  }
}
