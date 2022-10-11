import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { VendorProductTiers } from '../model/VendorProductTiers';

@EntityRepository(VendorProductTiers)
export class VendorProductTiersRepository extends BaseRepository<VendorProductTiers> {}
