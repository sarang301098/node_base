import { EntityRepository, getManager } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Tokens } from '../model/Tokens';
import { Users } from '../model/Users';

@EntityRepository(Tokens)
export class TokensRepository extends BaseRepository<Tokens> {
  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { lastLogin: new Date() });
  }

  async getByUserId(id: string): Promise<Tokens> {
    return await this.findOneOrFail({ user: await getManager().getRepository(Users).findOne(id) });
  }
}
