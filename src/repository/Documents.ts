import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Documents } from '../model/Documents';

@EntityRepository(Documents)
export class DocumentsRepository extends BaseRepository<Documents> {}
