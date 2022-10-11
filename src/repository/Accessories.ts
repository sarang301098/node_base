import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Accessories } from '../model/Accessory';

@EntityRepository(Accessories)
export class AccessoriesRepository extends BaseRepository<Accessories> {}
