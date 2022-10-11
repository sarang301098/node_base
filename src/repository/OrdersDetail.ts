import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { OrderDetails } from '../model/OrderDetails';

@EntityRepository(OrderDetails)
export class OrderDetailsRepository extends BaseRepository<OrderDetails> {
  getvendorsOrderCountByTimeslot = async (): Promise<number> => {
    return this.count({
      where: {},
    });
  };

  async getById(id: number): Promise<OrderDetails | undefined> {
    return this.findOne({
      where: { id },
      relations: [
        'order',
        'order.user',
        'order.timeSlot',
        'product',
        'product.details',
        'vendor',
        'driver',
        'driver.driver',
        'location',
        'cylinderSize',
        'category',
        'accessory',
        'promocodes',
        'cancellationReason',
      ],
    });
  }
}
