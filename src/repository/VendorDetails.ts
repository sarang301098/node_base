import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { VendorDetails } from '../model/VendorDetails';

@EntityRepository(VendorDetails)
export class VendorDetailsRepository extends BaseRepository<VendorDetails> {}
