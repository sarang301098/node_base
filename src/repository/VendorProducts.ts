import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { VendorProducts } from '../model/VendorProducts';

@EntityRepository(VendorProducts)
export class VendorProductsRepository extends BaseRepository<VendorProducts> {
  async getByRelatioins(
    vendorProductId: number,
    relations: Array<string>,
  ): Promise<VendorProducts | undefined> {
    return this.findOne({ where: { id: vendorProductId }, relations });
  }
}
