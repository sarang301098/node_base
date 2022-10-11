import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { MembershipPlanDetails } from '../model/MembershipPlanDetails';

@EntityRepository(MembershipPlanDetails)
export class MembershipPlanDetailsRepository extends BaseRepository<MembershipPlanDetails> {}
