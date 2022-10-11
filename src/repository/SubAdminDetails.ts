import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { SubAdminDetails } from '../model/SubAdminDetails';

@EntityRepository(SubAdminDetails)
export class SubAdminDetailsRepository extends BaseRepository<SubAdminDetails> {}
