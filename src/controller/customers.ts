import { getRepository, getManager, Brackets } from 'typeorm';
import { Joi } from 'express-validation';
import { Request, Response } from 'express';
import { groupBy, map, flatMap } from 'lodash';

import { Cart } from '../model/Cart';
import { Users } from '../model/Users';
import { Tokens } from '../model/Tokens';
import { Documents } from '../model/Documents';
import { UserAddresses } from '../model/UserAddress';
import { OrderDetails } from '../model/OrderDetails';
import { UserSubscription } from '../model/UserSubscription';
import { UserVerificationDetails } from '../model/UserVerificationDetails';
import * as momentTimeZone from 'moment-timezone';
import { PropaneUserType, OrderStatus } from '../constants';

/**
 * Title: Customer_Info API:
 * Created By: Mohammad Hussain Aghariya;
 *
 */
export const allCustomerValidation = {
  query: Joi.object({
    sortBy: Joi.string().default('fullName'),
    endAt: Joi.date().optional().allow(null),
    startAt: Joi.date().optional().allow(null),
    page: Joi.number().integer().min(1).default(1),
    status: Joi.boolean().optional().default(null),
    perPage: Joi.number().integer().min(1).default(10),
    membershipStatus: Joi.number().integer().optional(),
    search: Joi.string().max(50).default(null).optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
  }),
};
export const allCustomer = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, sort, sortBy, status, startAt, endAt, membershipStatus },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select([
      'user.id',
      'user.email',
      'user.isActive',
      'user.fullName',
      'user.createdAt',
      'user.profileImage',
      'user.countryCode',
      'user.mobileNumber',
      'user.userSubscriptionCount',
    ])
    .where('user.userType = :userType', { userType: PropaneUserType.USER })
    .leftJoin('user.orders', 'orders')
    .addSelect(['orders.id'])
    .leftJoin('orders.details', 'orderDetails')
    .addSelect(['orderDetails.id', 'orderDetails.orderType', 'orderDetails.category_id'])
    .take(limit)
    .skip(offset);

  if (membershipStatus) {
    if (Number(membershipStatus) === 1) {
      query.andWhere(
        new Brackets((qb) => {
          return qb
            .orWhere('user.userSubscriptionCount = 0')
            .orWhere('user.userSubscriptionCount IS NULL');
        }),
      );
    }
    if (Number(membershipStatus) === 2) {
      query.andWhere('user.userSubscriptionCount > 0');
    }
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (status !== null) {
    query.andWhere('user.isActive = :status', { status });
  }

  if (sort && sortBy) {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC');
  }

  if (startAt && endAt) {
    query.andWhere('user.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  const [customer, count] = await query.getManyAndCount();

  const response = {
    count,
    // TODO: remove any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers: customer as any,
  };

  if (customer && customer.length) {
    response.customers = customer.map((user) => {
      const orderDetails = flatMap(map(user?.orders, 'details'));
      return {
        ...user,
        orders: groupBy(orderDetails, 'orderType'),
      };
    });
  }

  res.status(200).json({ ...response });
};

export const getUserValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const getById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const customer = await getManager()
    .createQueryBuilder(Users, 'user')
    .where('user.id = :id', { id })
    .leftJoinAndSelect(
      'user.subscription',
      'subscription',
      'subscription.startDate <= CURRENT_TIMESTAMP() AND subscription.endDate >= CURRENT_TIMESTAMP() AND subscription.isActive = true AND subscription.status = 2',
    )
    .leftJoin('subscription.membershipPlan', 'membershipPlan')
    .addSelect(['membershipPlan.id', 'membershipPlan.name'])
    .leftJoin('user.orders', 'orders')
    .leftJoin('orders.details', 'orderDetails')
    .addSelect([
      'orders.id',
      'orderDetails.id',
      'orderDetails.orderType',
      'orderDetails.category_id',
    ])
    .getOne();

  res
    .status(200)
    .json({ ...customer, orders: (flatMap(map(customer?.orders, 'details')) || []).length });
};

export const getCustomerOrdersValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  query: Joi.object({
    endAt: Joi.date().optional(),
    startAt: Joi.date().optional(),
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .default(null),
    sort: Joi.string().valid('ASC', 'DESC').default('DESC'),
    sortBy: Joi.string().default('createdAt'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(20),
    search: Joi.string().max(50).default(null).optional(),
    orderType: Joi.number().integer().min(1).max(2).optional(),
    categoryId: Joi.number().integer().default(null).optional(),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    freelanceDriverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
  }),
};
export const getCustomerOrders = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
    query: {
      sort,
      page,
      endAt,
      status,
      search,
      sortBy,
      startAt,
      perPage,
      vendorId,
      driverId,
      orderType,
      categoryId,
      freelanceDriverId,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetails')
    .leftJoin('orderDetails.category', 'category')
    .addSelect(['category.id', 'category.name'])
    .leftJoin('orderDetails.rating', 'rating', 'rating.isActive = :isActive', { isActive: true })
    .addSelect(['rating.id', 'rating.review', 'rating.rating'])
    .leftJoinAndSelect('orderDetails.order', 'order')
    .andWhere('order.user_id = :id', { id })
    .leftJoin('orderDetails.product', 'product')
    .addSelect(['product.id', 'product.name', 'product.logo'])
    .leftJoin('orderDetails.accessory', 'accessory')
    .addSelect(['accessory.id', 'accessory.name', 'accessory.image', 'accessory.description'])
    .leftJoin('order.user', 'user')
    .leftJoin('order.userAddress', 'userAddress')
    .addSelect([
      'userAddress.id',
      'userAddress.fullName',
      'userAddress.state',
      'userAddress.countryCode',
      'userAddress.phoneNumber',
      'userAddress.county',
      'userAddress.city',
      'userAddress.country',
      'userAddress.addressType',
      'userAddress.isDefault',
      'userAddress.houseNo',
      'userAddress.address',
      'userAddress.lat',
      'userAddress.long',
    ])
    .leftJoin('orderDetails.driver', 'driver')
    .leftJoin('driver.driver', 'driverDetails')
    .addSelect([
      'driverDetails.id',
      'driverDetails.lat',
      'driverDetails.long',
      'driverDetails.identity',
      'driverDetails.licenceNo',
      'driverDetails.vehicalNo',
      'driverDetails.personalId',
      'driverDetails.idInformation',
      'driverDetails.driverVehicle',
      'driverDetails.identityInformation',
    ])
    .leftJoin('orderDetails.vendor', 'vendor')
    .addSelect([
      'user.id',
      'driver.id',
      'vendor.id',
      'user.fullName',
      'vendor.fullName',
      'driver.fullName',
      'driver.countryCode',
      'driver.mobileNumber',
    ])
    .offset(offset)
    .limit(limit);

  if (orderType && orderType !== null) {
    query.andWhere('orderDetails.orderType = :orderType', { orderType });
  }

  if (freelanceDriverId || driverId) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('orderDetails.driver_id = :freelanceDriverId', { freelanceDriverId })
          .orWhere('orderDetails.driver_id = :driverId', { driverId });
      }),
    );
  }

  if (vendorId && vendorId !== null) {
    query.andWhere('orderDetails.vendor_id = :vendorId', { vendorId });
  }

  if (search && search !== null) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('user.full_name like :name', { name: '%' + search + '%' })
          .orWhere('driver.full_name like :name', { name: '%' + search + '%' })
          .orWhere('vendor.full_name like :name', { name: '%' + search + '%' });
      }),
    );
  }

  if (endAt && startAt) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('orderDetails.createdAt >= :startAt AND orderDetails.createdAt <= :endAt', {
            startAt: momentTimeZone.tz(startAt, 'America/New_York').startOf('day').format(),
            endAt: momentTimeZone.tz(endAt, 'America/New_York').endOf('day').format(),
          })
          .orWhere(
            'orderDetails.scheduleDate >= :startAt AND orderDetails.scheduleDate <= :endAt',
            {
              startAt: momentTimeZone.tz(startAt, 'America/New_York').startOf('day').format(),
              endAt: momentTimeZone.tz(endAt, 'America/New_York').endOf('day').format(),
            },
          );
      }),
    );
  }

  if (status) {
    query.andWhere('orderDetails.status = :status', { status });
  }

  if (categoryId && categoryId !== null) {
    query.andWhere('orderDetails.category_id = :categoryId', { categoryId });
  }

  if (sort && sortBy === 'driver') {
    query.orderBy('driver.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'vendor') {
    query.orderBy('vendor.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'createdAt') {
    query.orderBy('orderDetails.created_at', sort as 'ASC' | 'DESC');
  }

  const [orders, count] = await query.getManyAndCount();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = {
    orders,
    count,
  };
  if (orders && orders.length) {
    response.orders = (orders || []).map((orderDetails) => {
      return {
        ...orderDetails,
        lat: orderDetails?.order?.lat,
        long: orderDetails?.order?.long,
        userId: orderDetails?.order?.userId,
        address: orderDetails?.order?.address,
        vendorName: orderDetails?.vendor?.fullName || '',
        driverName: orderDetails?.driver?.fullName || '',
        categoryName: orderDetails?.category?.name || '',
        timeSlotsId: orderDetails?.order?.timeSlotsId,
        invoicedReceiptUrl: orderDetails?.order?.invoicedReceiptUrl,
        countryCode: orderDetails?.order.userAddress?.countryCode || '',
        phoneNumber: orderDetails?.order.userAddress?.phoneNumber || '',
        addressType: orderDetails?.order.userAddress?.addressType || '',
        addressName: orderDetails?.order.userAddress?.fullName || '',
        productName: orderDetails?.product?.name || orderDetails?.accessory?.name || '',
        productImage: orderDetails?.product?.logo || orderDetails?.accessory?.image || '',
        driverLat: orderDetails?.driver?.driver?.lat || '',
        driverLong: orderDetails?.driver?.driver?.long || '',
        order: undefined,
        vendor: undefined,
        category: undefined,
      };
    });
  }

  res.status(200).json({ ...response });
};

export const getAllCustomersOptions = () => async (req: Request, res: Response): Promise<void> => {
  const usersRepo = getRepository(Users);

  const [vendors, count] = await usersRepo.findAndCount({
    where: { isActive: true, userType: PropaneUserType.USER },
    select: ['id', 'fullName'],
  });

  res.status(200).json({ vendors, count });
};

export const deleteCustomerValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const removeCustomer = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.softDelete(Cart, { user: id });
    await em.softDelete(Tokens, { user: id });
    await em.softDelete(Documents, { user: id });
    await em.softDelete(UserAddresses, { user: id });
    await em.softDelete(UserSubscription, { user: id });
    await em.softDelete(UserVerificationDetails, { user: id });
    await em.update(Users, { id }, { updatedBy: userId });
    await em.softDelete(Users, id);
  });

  res.sendStatus(204);
};

export const restoreCustomerValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const restoreCustomer = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.restore(Cart, { user: id });
    await em.restore(Tokens, { user: id });
    await em.restore(Documents, { user: id });
    await em.restore(UserAddresses, { user: id });
    await em.restore(UserSubscription, { user: id });
    await em.restore(UserVerificationDetails, { user: id });
    await em.update(Users, { id }, { updatedBy: userId });
    await em.restore(Users, id);
  });

  res.sendStatus(204);
};
