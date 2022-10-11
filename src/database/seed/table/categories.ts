import { In, QueryRunner } from 'typeorm';

import { Categories } from '../../../model/Categories';

const Category = [
  {
    id: 1,
    name: 'Spare Tank',
    orderType: 2,
  },
  {
    id: 2,
    name: 'Exchange',
    orderType: 2,
  },
  {
    id: 3,
    name: 'Accessory',
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const categoryRepo = queryRunner.manager.getRepository(Categories);
  await categoryRepo.save([...Category]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const categoryRepo = queryRunner.manager.getRepository(Categories);
  await categoryRepo.delete({ id: In(Category.map((Category) => Category.id)) });
};

export default { up, down };
