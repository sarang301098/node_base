import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { GovernmentHolidays } from '../model/GovernmentHolidays';

@EntityRepository(GovernmentHolidays)
export class GovernmentHolidaysRepository extends BaseRepository<GovernmentHolidays> {}
