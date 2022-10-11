import { DriverAssignment } from './DriverAssignment';
import { CronJob } from 'cron';
import logger from './log';
import { updateStatusSubscription } from '../controller/userSubscription';
import config from '../config';
import moment from 'moment';
import mysqldump from 'mysqldump';
import { getCustomRepository } from 'typeorm';
import { DriverDetailsRepository } from '../repository/DriverDetails';

export class Cron {
  private static instance: Cron;
  constructor() {
    if (Cron.instance instanceof Cron) {
      return Cron.instance;
    }
    Cron.instance = this;
  }

  public async execute(): Promise<void> {
    this.driverAssignmentCron();
    this.createDBdump();
    this.resetDriverLatLong();
  }

  private driverAssignmentCron() {
    new CronJob(
      '00 01 * * *',
      () => {
        try {
          new DriverAssignment().execute();
          logger.info('driver assignment completed at 01:00 AM.');
        } catch (error) {
          logger.error('Error in driver assignment cron', error);
        }
      },
      null,
      true,
      'America/New_York',
    ).start();
  }

  private createDBdump() {
    new CronJob(
      '00 00 * * *',
      () => {
        updateStatusSubscription();
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

  private resetDriverLatLong() {
    new CronJob(
      '00 00 * * *',
      async () => {
        const driverDetailsRepository = getCustomRepository(DriverDetailsRepository);
        await driverDetailsRepository.update({}, { lat: null, long: null });
      },
      null,
      true,
      'America/New_York',
    ).start();
  }
}
