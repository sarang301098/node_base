import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { VendorProductsPricing } from '../model/VendorProductPricing';

@EntityRepository(VendorProductsPricing)
export class VendorProductsPricingRepository extends BaseRepository<VendorProductsPricing> {}
