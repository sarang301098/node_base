import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { CylinderSizes } from '../model/CylinderSizes';

@EntityRepository(CylinderSizes)
export class CylinderSizesRepository extends BaseRepository<CylinderSizes> {}
