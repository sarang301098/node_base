import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { DeliveryLocations } from '../model/deliveryLocations';

@EntityRepository(DeliveryLocations)
export class DeliveryLocationsRepository extends BaseRepository<DeliveryLocations> {}
