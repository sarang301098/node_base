import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Appsettings } from '../model/Appsettings';

@EntityRepository(Appsettings)
export class AppsettingsRepository extends BaseRepository<Appsettings> {}
