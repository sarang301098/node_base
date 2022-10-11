import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { CmsPages } from '../model/CmsPages';

@EntityRepository(CmsPages)
export class CmsPagesRepository extends BaseRepository<CmsPages> {}
