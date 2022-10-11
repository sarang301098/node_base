import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { PromoCodes } from '../model/Promocodes';

@EntityRepository(PromoCodes)
export class PromoCodesRepository extends BaseRepository<PromoCodes> {}
