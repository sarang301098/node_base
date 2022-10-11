import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { TimeSlots } from '../model/TimeSlots';

@EntityRepository(TimeSlots)
export class TimeSlotsRepository extends BaseRepository<TimeSlots> {}
