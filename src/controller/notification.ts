import { getManager, getRepository, In, Brackets } from 'typeorm';
import { Joi } from 'express-validation';
import { Request, Response } from 'express';
import { uniq } from 'lodash';

import SendPushNotificationService from '../service/notification';

import { Users } from '../model/Users';
import { Notification } from '../model/Notification';

import { BadRequestError } from '../error';
import { NotificationType, PropaneUserType, NotificationActions } from '../constants';

/**
 * Title: Notification Module API;
 * Created By: Mohammad Hussain Aghariya;
 */

export const getAllValidation = {
  query: Joi.object({
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isAdmin: Joi.boolean().optional(),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId, userType },
    query: { search, page, perPage, isAdmin },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Notification, 'notification')
    .andWhere(
      '(NOT FIND_IN_SET(:userId, notification.deletedBy) OR notification.deletedBy IS NULL)',
      { userId },
    )
    .offset(offset)
    .limit(limit);

  if (userType && userType === (PropaneUserType.ADMIN || PropaneUserType.SUB_ADMIN)) {
    query.where('notification.isAdmin = :isAdmin', { isAdmin });
  }

  if (search && search !== '') {
    query.andWhere('notification.description like :description', {
      description: '%' + search + '%',
    });
  }

  if (
    userType &&
    (userType === PropaneUserType.USER ||
      userType === PropaneUserType.DRIVER ||
      userType === PropaneUserType.VENDOR)
  ) {
    query.andWhere('FIND_IN_SET(:userId, notification.toIds)', {
      userId,
    });
  }

  const unreadNotification = getManager()
    .createQueryBuilder(Notification, 'notification')
    .where('notification.isAdmin = :isAdmin', { isAdmin })
    .andWhere(
      '(NOT FIND_IN_SET(:userId, notification.readedBy) OR notification.readedBy IS NULL)',
      { userId },
    )
    .andWhere(
      '(NOT FIND_IN_SET(:userId, notification.deletedBy) OR notification.deletedBy IS NULL)',
      { userId },
    );

  if (userType && userType === (PropaneUserType.ADMIN || PropaneUserType.SUB_ADMIN)) {
    unreadNotification.andWhere(
      new Brackets((qb) => {
        return qb
          .andWhere('notification.isAdmin = :isAdmin', { isAdmin })
          .andWhere(
            '(NOT FIND_IN_SET(:userId, notification.readedBy) OR notification.readedBy IS NULL)',
            { userId },
          )
          .andWhere(
            '(NOT FIND_IN_SET(:userId, notification.deletedBy) OR notification.deletedBy IS NULL)',
            { userId },
          );
      }),
    );
  }

  if (
    userType &&
    (userType === PropaneUserType.USER ||
      userType === PropaneUserType.DRIVER ||
      userType === PropaneUserType.VENDOR)
  ) {
    unreadNotification.andWhere('FIND_IN_SET(:userId, notification.toIds)', {
      userId,
    });
  }

  const unreadNotificaionCount = await unreadNotification.getCount();
  const [notifications, count] = await query.getManyAndCount();
  res.status(200).json({ notifications, count, unreadNotificaionCount });
};

export const sendNotificationValidation = {
  body: Joi.object({
    notifyto: Joi.string().min(1).required(),
    notifyIds: Joi.when('notifyto', {
      is: Joi.exist().valid('selectedCustomer', 'selectedDrivers'),
      then: Joi.array()
        .items(Joi.string().uuid({ version: 'uuidv4' }).required())
        .required(),
    }),
    message: Joi.string().min(1).required(),
    title: Joi.string().min(1).required(),
  }),
};
export const sendNotification = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { notifyto, notifyIds, title, message },
  } = req;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select(['user.id', 'user.fullName', 'user.userType'])
    .leftJoin('user.token', 'token')
    .addSelect(['token.id', 'token.deviceId']);

  if (notifyto === NotificationType.AC) {
    query.where('user.userType = :userType', { userType: PropaneUserType.USER });
  } else if (notifyto === NotificationType.AD) {
    query.andWhere('user.userType = :userType', { userType: PropaneUserType.DRIVER });
  } else if (notifyto === NotificationType.AV) {
    query.andWhere('user.userType = :userType', { userType: PropaneUserType.VENDOR });
  } else if (notifyto === NotificationType.SC) {
    query
      .andWhere('user.userType = :userType', { userType: PropaneUserType.USER })
      .andWhere('user.id IN (:...notifyIds)', { notifyIds });
  } else if (notifyto === NotificationType.SD) {
    query
      .andWhere('user.userType = :userType', { userType: PropaneUserType.DRIVER })
      .andWhere('user.id IN (:...notifyIds)', { notifyIds });
  } else if (notifyto === NotificationType.SV) {
    query
      .andWhere('user.userType = :userType', { userType: PropaneUserType.VENDOR })
      .andWhere('user.id IN (:...notifyIds)', { notifyIds });
  }

  const [userData] = await query.getManyAndCount();

  const description = `${message}`;

  // TODO: Currently only single login is available In future multi device login is there needs to change the tokens variable.
  /**
   * Like:
   * const deviceIds = compact(map(flatMap(map(user, 'token')), 'deviceId'));
   */
  const tokens = (
    (userData || []).map((user) => user?.token && user?.token?.deviceId) || []
  ).filter((data) => data);

  const toIds = (userData || []).map((user) => user.id);

  const notificationRepo = getRepository(Notification);
  let notification = notificationRepo.create({
    title,
    toIds,
    description,
    readedBy: [],
    deletedBy: [],
    fromId: user?.id,
    notificationType: 1,
    isAdmin: user?.userType === (PropaneUserType.ADMIN || PropaneUserType.SUB_ADMIN),
  });
  notification = await notificationRepo.save(notification);

  // When tokens is exist then executed logic
  if (tokens && tokens.length) {
    try {
      const notificationService = new SendPushNotificationService();
      const notificationBody = {
        toIds,
        title,
        tokens,
        description,
        isAdmin: true,
        fromId: user?.id,
        notificationType: 1,
      };
      await notificationService.execute(notificationBody);
    } catch (error) {
      await notificationRepo.delete(notification?.id);
      throw new BadRequestError('Error while send notification', 'NOTIFICATION_SENT_ERROR');
    }
  }

  res.status(201).json({ notification });
};

export const removeNotificationValidation = {
  body: Joi.object({
    notificationIds: Joi.array().items(Joi.number().integer().required()).required(),
  }),
};
export const removeNotification = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { notificationIds },
  } = req;

  if (notificationIds && notificationIds.length) {
    (notificationIds || []).forEach(async (id: number) => {
      await getManager().transaction(async (em) => {
        await em.softDelete(Notification, id);
      });
    });
  }

  res.sendStatus(204);
};

export const clearAllNotification = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
  } = req;

  const query = getManager()
    .createQueryBuilder(Notification, 'notification')
    .where('FIND_IN_SET(:userId, notification.toIds)', {
      userId,
    })
    .andWhere('NOT FIND_IN_SET(:userId, notification.deletedBy)', {
      userId,
    });

  const [userNotifications, count] = await query.getManyAndCount();

  const notificationRepo = getRepository(Notification);
  if (userNotifications && userNotifications.length) {
    for (let index = 0; index < count; index++) {
      userNotifications[index] = Object.assign({}, userNotifications[index], {
        deletedBy: userNotifications[index]?.deletedBy
          ? [...(userNotifications[index]?.deletedBy || []), userId]
          : [userId],
      });
    }
  }

  await notificationRepo.save([...userNotifications]);

  res.sendStatus(204);
};

export const readNotificationValidation = {
  body: Joi.object({
    readedOption: Joi.string().min(1).required(),
    notificationIds: Joi.array().items(Joi.number().integer().min(1).required()),
  }),
};
export const readNotification = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { notificationIds, readedOption },
  } = req;

  const notificationRepo = getRepository(Notification);
  const notifications = await notificationRepo.find({ where: { id: In(notificationIds) } });

  for (let index = 0; index < notifications.length; index++) {
    let readedBy: Array<string | number> = [];
    if (readedOption && readedOption === NotificationActions.READ) {
      readedBy = notifications[index]?.readedBy || [];

      if (readedBy && readedBy.length) readedBy = uniq([...readedBy, user.id]);
      else readedBy = [user.id];
    } else if (readedOption && readedOption === NotificationActions.UN_READ) {
      readedBy = notifications[index]?.readedBy || [];

      if (readedBy && readedBy.length) readedBy = readedBy.filter((id) => id !== user?.id);
      else readedBy = [];
    }
    notifications[index] = Object.assign({}, notifications[index], { readedBy });
  }

  await notificationRepo.save(notifications);

  res.sendStatus(204);
};

export const notificationsSentUsersOptionsValidation = {
  body: Joi.object({
    userIds: Joi.array()
      .items(Joi.string().uuid({ version: 'uuidv4' }).optional())
      .required(),
  }),
};
export const notificationsSentUsersOptions = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    body: { userIds },
  } = req;

  const usersRepository = getRepository(Users);
  const users = await usersRepository.find({
    where: { id: In(userIds) },
    select: ['id', 'fullName', 'deletedAt'],
    withDeleted: true,
  });

  res.json({ users });
};
