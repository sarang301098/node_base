import { Request, Response } from 'express';
import { getManager, Brackets } from 'typeorm';
import { Joi } from 'express-validation';

import moment from 'moment';
import { OrderDetails } from '../model/OrderDetails';

export const allDriversValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    freelanceDriverId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    orderType: Joi.number().optional(),
  }),
};
export const allDrivers = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { vendorId, driverId, freelanceDriverId, orderType },
  } = req;

  const startAt = moment().startOf('day').toDate();
  const endAt = moment().endOf('day').toDate();

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'OrderDetails')
    .select(['OrderDetails.id'])
    .where('OrderDetails.scheduleDate BETWEEN :startAt AND :endAt', { startAt, endAt })
    .leftJoin('OrderDetails.order', 'order')
    .addSelect(['order.id', 'order.address'])
    .leftJoin('OrderDetails.driver', 'users')
    .addSelect(['users.id', 'users.fullName', 'users.mobileNumber', 'users.countryCode'])
    .leftJoin('users.driver', 'driverDetails')
    .addSelect([
      'driverDetails.vendor',
      'driverDetails.id',
      'driverDetails.vehicalNo',
      'driverDetails.lat',
      'driverDetails.user',
      'driverDetails.long',
    ]);

  if (vendorId && vendorId !== '') {
    query.andWhere('OrderDetails.vendor =:vendorId', { vendorId });
  }

  if (freelanceDriverId || driverId) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('OrderDetails.driver_id = :freelanceDriverId', { freelanceDriverId })
          .orWhere('OrderDetails.driver_id = :driverId', { driverId });
      }),
    );
  }

  if (orderType && orderType !== '') {
    query.andWhere('OrderDetails.orderType =:orderType', { orderType });
  }

  // TODO: Resolve Bug of the query.getManyAndCount() query generation.
  const count = await query.getCount();
  const drivers = await query.getMany();

  res.status(200).json({ drivers, count });
};
