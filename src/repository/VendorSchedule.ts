import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { VendorSchedule } from '../model/VendorSchedule';

@EntityRepository(VendorSchedule)
export class VendorScheduleRepository extends BaseRepository<VendorSchedule> {}
