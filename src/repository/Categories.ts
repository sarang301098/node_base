import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Categories } from '../model/Categories';

@EntityRepository(Categories)
export class CategoriesRepository extends BaseRepository<Categories> {}
