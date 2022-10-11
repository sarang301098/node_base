import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Products } from '../model/Products';

@EntityRepository(Products)
export class ProductsRepository extends BaseRepository<Products> {}
