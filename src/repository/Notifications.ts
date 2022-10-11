import { EntityRepository } from 'typeorm';

import { BaseRepository } from './BaseRepository';
import { Notification } from '../model/Notification';

@EntityRepository(Notification)
export class NotificationsRepository extends BaseRepository<Notification> {
  async getByRelatioins(
    notification: Notification,
    relations: Array<string>,
  ): Promise<Notification | undefined> {
    return this.findOne({ where: { id: notification?.id }, relations });
  }
}
