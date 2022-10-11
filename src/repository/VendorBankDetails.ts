import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { VendorBankDetails } from '../model/VendorBankDetails';

@EntityRepository(VendorBankDetails)
export class VendorBankDetailsRepository extends BaseRepository<VendorBankDetails> {}
