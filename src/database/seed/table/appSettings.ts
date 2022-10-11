import { In, QueryRunner } from 'typeorm';

import { Appsettings } from '../../../model/Appsettings';

const settings = [
  {
    id: 1,
    key: 'service_charge',
    label: 'Service Charge',
    value: 5,
    type: 2,
  },
  {
    id: 2,
    key: 'service_fee',
    label: 'Service Fee',
    value: 5,
    type: 2,
  },
  {
    id: 3,
    key: 'delivery_fee',
    label: 'Delivery Fee',
    value: 1,
    type: 2,
  },
  {
    id: 4,
    orderType: 1,
    key: 'cancellation_charge_customer',
    label: 'Cancellation Charge (Customer)',
    value: 1,
    type: 1,
  },
  {
    id: 5,
    orderType: 1,
    key: 'cancellation_charge_driver',
    label: 'Cancellation Charge (Driver)',
    value: 1,
    type: 1,
  },
  {
    id: 6,
    orderType: 1,
    key: 'freelance_driver_price',
    label: 'Freelance Driver Price',
    value: 1,
    type: 1,
  },
  {
    id: 7,
    orderType: 2,
    key: 'cancellation_charge_customer',
    label: 'Cancellation Charge (Customer)',
    value: 1,
    type: 1,
  },
  {
    id: 8,
    orderType: 2,
    key: 'cancellation_charge_driver',
    label: 'Cancellation Charge (Driver)',
    value: 1,
    type: 1,
  },
  {
    id: 9,
    orderType: 2,
    key: 'freelance_driver_price',
    label: 'Freelance Driver Price',
    value: 1,
    type: 1,
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const settingRepo = queryRunner.manager.getRepository(Appsettings);
  await settingRepo.save([...settings]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const settingRepo = queryRunner.manager.getRepository(Appsettings);
  await settingRepo.delete({ id: In(settings.map((set) => set.id)) });
};

export default { up, down };
