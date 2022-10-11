import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Cart } from '../model/Cart';

@EntityRepository(Cart)
export class CartRepository extends BaseRepository<Cart> {}
