import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { UserOrderStatistics } from '../model/UserOrderStatistics';

@EntityRepository(UserOrderStatistics)
export class UserOrderStatisticsRepository extends BaseRepository<UserOrderStatistics> {}
