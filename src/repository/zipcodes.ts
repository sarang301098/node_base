import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { ZipCodes } from '../model/ZipCodes';

@EntityRepository(ZipCodes)
export class ZipCodesRepository extends BaseRepository<ZipCodes> {}
