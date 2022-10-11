import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { Joi } from 'express-validation';

import { Users } from '../model/Users';
import { PropaneUserType, OrderStatus } from '../constants';

export const getVendorEarningValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
  }),
};
export const getVendorsEarning = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { vendorId, startAt, endAt, search, page, perPage },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select(['user.id', 'user.fullName', 'user.email', 'user.mobileNumber', 'user.userType'])
    .groupBy('user.id')
    .where('user.userType = :userType', { userType: PropaneUserType.VENDOR })
    .offset(offset)
    .limit(limit)
    .leftJoin('user.vendorOrders', 'orderdetail')
    .addSelect([
      'SUM(orderdetail.adminReceivedAmount ) "AdminRecievedAmount"',
      'SUM(orderdetail.vendorReceivedAmount ) "vendorRecievedAmount"',
      'COUNT(orderdetail.id ) "orders"',
    ]);

  if (startAt && endAt) {
    query.andWhere('orderdetail.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (vendorId && vendorId !== '') {
    query.andWhere('user.id = :vendorId', { vendorId });
  }

  const earnings = await query.getRawMany();
  const count = await query.getCount();

  res.status(200).json({ earnings, count });
};

export const getAdmincancelledEarningValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
  }),
};

export const getAdmincancelledEarning = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    query: { vendorId, startAt, endAt, search, page, perPage },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select(['user.id', 'user.fullName', 'user.email', 'user.mobileNumber', 'user.userType'])
    .where('user.userType = :userType', { userType: PropaneUserType.VENDOR })
    .groupBy('user.id')
    .leftJoin('user.vendorOrders', 'orderdetail')
    .addSelect([
      'sum(orderdetail.adminReceivedAmount) "adminTotalEarning"',
      'orderdetail.id',
      'orderdetail.status',
      'count(orderdetail.id  ) "orders"',
    ])
    .andWhere('orderdetail.status IN (:...status)', {
      status: [OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_ADMIN],
    })
    .offset(offset)
    .limit(limit);

  if (startAt && endAt) {
    query.andWhere('orderdetail.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (vendorId && vendorId !== '') {
    query.andWhere('orderdetail.vendor = :vendor', { vendor: vendorId });
  }

  const cancelledearnings = await query.getRawMany();
  const count = await query.getCount();

  res.status(200).json({ cancelledearnings, count });
};
