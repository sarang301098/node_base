import { Brackets, getManager } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { OrderDetails } from '../model/OrderDetails';
import { OrderStatus } from '../constants';
import { FreelanceDriversPayment } from '../model/FreelanceDriverPayments';

export const getTransactionsValidation = {
  query: Joi.object({
    endAt: Joi.date().optional(),
    startAt: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    search: Joi.string().max(50).allow(null).default(null),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { endAt, startAt, search, page, perPage },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetails')
    .select([
      'orderDetails.id',
      'orderDetails.grandTotal',
      'orderDetails.vendorReceivedAmount',
      'orderDetails.adminReceivedAmount',
      'orderDetails.createdAt',
    ])
    .leftJoin('orderDetails.vendor', 'vendor')
    .addSelect([
      'vendor.id',
      'vendor.fullName',
      'vendor.countryCode',
      'vendor.mobileNumber',
      'vendor.email',
    ])
    .leftJoin('orderDetails.driver', 'driver')
    .addSelect([
      'driver.id',
      'driver.fullName',
      'driver.countryCode',
      'driver.mobileNumber',
      'driver.email',
    ])
    .leftJoin('orderDetails.order', 'order')
    .leftJoin('order.user', 'user')
    .addSelect(['user.id', 'user.fullName', 'user.countryCode', 'user.mobileNumber', 'user.email'])
    .offset(offset)
    .limit(limit);

  if (search && search !== '') {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('user.full_name like :name', { name: '%' + search + '%' })
          .orWhere('driver.full_name like :name', { name: '%' + search + '%' })
          .orWhere('vendor.full_name like :name', { name: '%' + search + '%' });
      }),
    );
  }

  if (startAt && endAt) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('orderDetails.schedule_date BETWEEN :startAt AND :endAt', {
            startAt,
            endAt,
          })
          .orWhere('orderDetails.createdAt BETWEEN :startAt AND :endAt', {
            startAt,
            endAt,
          });
      }),
    );
  }

  const [transactions, count] = await query.getManyAndCount();

  res.status(200).json({ count, transactions });
};

export const freelancerTranscationDashbordValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
  }),
};
export const freelancerTranscationDashbord = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    user: { id: driverId },
    query: { startAt, endAt },
  } = req;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .select(['orderDetail.id', 'SUM(orderDetail.freelanceDriverReceivedAmount) "netEarning"'])
    .where('orderDetail.driver = :driverId', { driverId })
    .andWhere('orderDetail.status= :status', { status: OrderStatus.DELIVERED })
    .leftJoin('orderDetail.freelanceDriverPayment', 'freelanceDriverPayment')
    .addSelect(['SUM(freelanceDriverPayment.paidAmount) "online"'])
    .groupBy('orderDetail.driver')
    .addGroupBy('freelanceDriverPayment.driver');

  const dashboard = await query.getRawOne();
  const totalEarningOnDelivery = (dashboard?.netEarning || 0) - (dashboard?.online || 0);

  const transactionQuery = getManager()
    .createQueryBuilder(FreelanceDriversPayment, 'freelanceDriverPayment')
    .select(['freelanceDriverPayment.order_Id', 'freelanceDriverPayment.paidAmount'])
    .where('freelanceDriverPayment.driver = :driverId', { driverId })
    .andWhere('freelanceDriverPayment.createdAt BETWEEN :startAt AND :endAt', {
      startAt,
      endAt,
    });

  const transactions = await transactionQuery.getRawMany();

  res.status(200).json({ ...dashboard, totalEarningOnDelivery, transactions });
};

export const vendorTranscationDashbordValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
  }),
};

export const vendorTranscation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { startAt, endAt },
  } = req;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .select([
      'SUM(orderDetail.grandTotal) "totalEarning"',
      'SUM(orderDetail.vendorReceivedAmount)"netEArning"',
      'SUM(orderDetail.adminReceivedAmount)"adminCommisssionPercentage"',
      'SUM(orderDetail.grandTotal) "online"',
    ])
    .where('orderDetail.vendor = :vendor', { vendor: user?.id })
    .andWhere('orderDetail.createdAt BETWEEN :startAt AND :endAt', {
      startAt,
      endAt,
    })
    .groupBy('orderDetail.vendor');

  const queryTransaction = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .select(['orderDetail.id', 'orderDetail.grandTotal'])
    .where('orderDetail.createdAt BETWEEN :startAt AND :endAt', {
      startAt,
      endAt,
    })
    .andWhere('orderDetail.vendor = :vendor', { vendor: user?.id });

  const dashboard = await query.getRawOne();
  const transactions = await queryTransaction.getRawMany();

  const ifNoData = {
    totalEarning: 0,
    netEArning: 0,
    adminCommisssionPercentage: 0,
    online: 0,
  };

  const transaction = dashboard || ifNoData;
  transaction.transactions = transactions;

  res.status(200).json(transaction);
};
