import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Roles } from '../model/Roles';

@EntityRepository(Roles)
export class RolesRepository extends BaseRepository<Roles> {
  async getByRelatioins(role: Roles, relations: Array<string>): Promise<Roles | undefined> {
    return this.findOne({ where: { id: role?.id }, relations });
  }
}
