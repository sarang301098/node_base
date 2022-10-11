import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Counties } from '../model/Counties';

@EntityRepository(Counties)
export class CountiesRepository extends BaseRepository<Counties> {}
