import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { UserVerificationDetails } from '../model/UserVerificationDetails';

@EntityRepository(UserVerificationDetails)
export class UserVerificationDetailsRepository extends BaseRepository<UserVerificationDetails> {}
