import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { UserAddresses } from '../model/UserAddress';

@EntityRepository(UserAddresses)
export class UserAddressesRepository extends BaseRepository<UserAddresses> {}
