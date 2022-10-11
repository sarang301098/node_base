import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { MembershipPlanPrices } from '../model/MembershipPlanPrices';

@EntityRepository(MembershipPlanPrices)
export class MembershipPlanPricesRepository extends BaseRepository<MembershipPlanPrices> {}
