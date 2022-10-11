import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Faqs } from '../model/Faqs';

@EntityRepository(Faqs)
export class FaqsPageRepository extends BaseRepository<Faqs> {}
