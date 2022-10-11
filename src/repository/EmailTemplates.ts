import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { EmailTemplates } from '../model/EmailTemplates';

@EntityRepository(EmailTemplates)
export class EmailTemplatesRepository extends BaseRepository<EmailTemplates> {}
