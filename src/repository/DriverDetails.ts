import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { DriverDetails } from '../model/DriverDetails';

@EntityRepository(DriverDetails)
export class DriverDetailsRepository extends BaseRepository<DriverDetails> {}
