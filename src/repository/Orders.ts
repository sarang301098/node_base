import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Orders } from '../model/Orders';

@EntityRepository(Orders)
export class OrdersRepository extends BaseRepository<Orders> {}
