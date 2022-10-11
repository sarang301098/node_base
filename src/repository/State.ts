import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { States } from '../model/States';

@EntityRepository(States)
export class StatesRepository extends BaseRepository<States> {}
