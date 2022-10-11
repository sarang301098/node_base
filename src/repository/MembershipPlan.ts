import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { MembershipPlans } from '../model/MembershipPlans';

@EntityRepository(MembershipPlans)
export class MembershipPlansRepository extends BaseRepository<MembershipPlans> {}
