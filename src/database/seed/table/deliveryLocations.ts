import { In, QueryRunner } from 'typeorm';

import { DeliveryLocations } from '../../../model/deliveryLocations';

const locations = [
  {
    id: 1,
    name: 'Front Door',
    price: 0,
  },
  {
    id: 2,
    name: 'Left Side in House',
    price: 0,
  },
  {
    id: 3,
    name: 'Right Side in House',
    price: 0,
  },
  {
    id: 4,
    name: 'Back of House',
    price: 0,
    description:
      'I authorize a reprehensive from Propane Bros. to enter the back yard of my property to complete this order.',
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const deliveryLocationRepo = queryRunner.manager.getRepository(DeliveryLocations);
  await deliveryLocationRepo.save([...locations]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const deliveryLocationRepo = queryRunner.manager.getRepository(DeliveryLocations);
  await deliveryLocationRepo.delete({ id: In(locations.map((loc) => loc.id)) });
};

export default { up, down };
