import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Modules } from '../model/Modules';

@EntityRepository(Modules)
export class ModulesRepository extends BaseRepository<Modules> {}
