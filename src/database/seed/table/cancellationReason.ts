import { In, QueryRunner } from 'typeorm';

import { PropaneUserType } from '../../../constants';
import { CancellationReasons } from '../../../model/CancellationReasons';

const CReasons = [
  {
    id: 1,
    reason: 'Vehicle Breakdown',
    userType: PropaneUserType.DRIVER,
  },
  {
    id: 2,
    reason: 'I have an accident',
    userType: PropaneUserType.DRIVER,
  },
  {
    id: 3,
    reason: 'Vehicle Punctured',
    userType: PropaneUserType.DRIVER,
  },
  {
    id: 4,
    reason: 'Customer not responding to call(s)',
    userType: PropaneUserType.DRIVER,
  },
];

const up = async (queryRunner: QueryRunner): Promise<void> => {
  const cancellationReasonRepo = queryRunner.manager.getRepository(CancellationReasons);
  await cancellationReasonRepo.save([...CReasons]);
};

const down = async (queryRunner: QueryRunner): Promise<void> => {
  const cancellationReasonRepo = queryRunner.manager.getRepository(CancellationReasons);
  await cancellationReasonRepo.delete({ id: In(CReasons.map((CReason) => CReason.id)) });
};

export default { up, down };
