import {
  getCustomRepository,
  getManager,
  getRepository,
  Brackets,
  getConnection,
  Not,
} from 'typeorm';
import { flatMap, groupBy, compact } from 'lodash';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { hash } from 'bcryptjs';
import { Users } from '../model/Users';
import { Documents } from '../model/Documents';
import { Notification } from '../model/Notification';
import { UserAddresses } from '../model/UserAddress';
import { OrderDetails } from '../model/OrderDetails';
import { DriverDetails } from '../model/DriverDetails';
import { CancellationReasons } from '../model/CancellationReasons';

import { UsersRepository } from '../repository/Users';
import { OrderDetailsRepository } from '../repository/OrdersDetail';
import { DriverDetailsRepository } from '../repository/DriverDetails';
import { NotificationsRepository } from '../repository/Notifications';

import { MailService } from '../service/Mail';
import { generateRandomHex } from '../service/random';
import SendPushNotificationService from '../service/notification';

import logger from '../service/log';
import { BadRequestError } from '../error';
import { PropaneUserType, OrderStatus } from '../constants';
import * as momentTimeZone from 'moment-timezone';
import { DriverOptimalPath, LatLong } from '../service/DriverOptimalPath';
import { VendorDetails } from '../model/VendorDetails';

const notificationMessage = (
  fullName: string | null | undefined,
  user: string | null | undefined,
  reason: string | null | undefined,
) => {
  return `${fullName ?? 'Your'} order is cancelled by ${user} ${reason ? `due to ${reason}` : ''} `;
};

export const getDriverValidation = {
  query: Joi.object({
    endAt: Joi.date().optional(),
    startAt: Joi.date().optional(),
    status: Joi.number().optional(),
    sortBy: Joi.string().default('fullName'),
    driverType: Joi.string().max(50).optional().valid('vendors', 'freelance'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isActive: Joi.boolean().optional().default(null),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    search: Joi.string().max(50).allow(null).default(null),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { search, status, driverType, sort, sortBy, startAt, endAt, isActive, page, perPage },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .where('user.userType = :userType', { userType: PropaneUserType.DRIVER })
    .select([
      'user.id',
      'user.email',
      'user.fullName',
      'user.isActive',
      'user.countryCode',
      'user.mobileNumber',
      'user.profileImage',
    ])
    .leftJoinAndSelect('user.driver', 'driver')
    .leftJoin('user.driverOrders', 'driverOrders', 'driverOrders.status =:deliverStatus', {
      deliverStatus: OrderStatus.DELIVERED,
    })
    .addSelect(['driverOrders.id', 'driverOrders.orderType', 'driverOrders.status']);

  // check the driverType
  if (driverType && driverType === 'vendors') {
    query.andWhere('driver.vendor_Id IS NOT NULL');
  }
  if (driverType && driverType === 'freelance') {
    query.andWhere('driver.vendor_Id IS NULL');
  }

  // This logic for when vendor login then executed
  if (user && user?.userType === PropaneUserType.VENDOR) {
    const userRepo = getCustomRepository(UsersRepository);
    const vendorsUser = await userRepo.getByRelatioins(user, ['vendor']);
    query.andWhere('driver.vendor_id = :vendorId', { vendorId: vendorsUser?.vendor?.id });
  }

  if (search && search !== '') {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('user.fullName like :fullName', { fullName: '%' + search + '%' })
          .orWhere('driver.licenceNo = :licenceNo', { licenceNo: '%' + search + '%' });
      }),
    );
  }

  if (sort && sortBy) {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC');
  }

  // This is status show for driver 0 = notApproved, 1 = approved, 2 = pending
  if (status !== undefined) {
    query.andWhere('driver.status = :status', { status });
  }

  if (startAt && endAt) {
    query.andWhere('user.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (isActive !== null) {
    query.andWhere('user.isActive = :isActive', { isActive });
  }

  query.take(limit).skip(offset);

  // TODO: This query getManyAndCount() faced issue somewhere in alias will fix it later.
  // WARNING: Not change the order of the excecution of below query.
  const count = await query.getCount();
  const drivers = await query.getMany();

  const response = {
    count,
    // TODO: remove any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drivers: drivers as any,
  };

  if (drivers && drivers.length) {
    response.drivers = drivers.map((driver) => {
      return {
        ...driver,
        orders: groupBy(flatMap(driver?.driverOrders), 'orderType'),
        driverOrders: undefined,
      };
    });
  }

  res.json({ ...response });
};

const namePattern = '^[A-za-z]';
export const createDriverValidation = {
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    email: Joi.string().lowercase().max(255).email().required(),
    countryCode: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    vehicalNo: Joi.string().required(),
    orderCapacity: Joi.number().integer().min(1).required(),
    orderType: Joi.number().integer().min(1).required(),
  }),
};
export const createDriver = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { orderType, fullName, countryCode, mobileNumber, vehicalNo, orderCapacity, email },
  } = req;

  const userRepo = getCustomRepository(UsersRepository);
  const driverRepo = getCustomRepository(DriverDetailsRepository);

  const existingUser = await userRepo.findOne({
    countryCode,
    mobileNumber,
    userType: PropaneUserType.DRIVER,
  });

  if (existingUser) {
    throw new BadRequestError('Email address already Used', 'EMAIL_ALREADY_EXIT');
  }
  const driverPassword = generateRandomHex(4);
  const password = await hash(driverPassword, 4);

  let userData = userRepo.create({
    email,
    fullName,
    password,
    countryCode,
    mobileNumber,
    userType: PropaneUserType.DRIVER,
  });
  userData = await userRepo.save(userData);

  const vendorsUser = await userRepo.getByRelatioins(user, ['vendor']);
  const vendorsZipcodes = await getManager()
    .createQueryBuilder(VendorDetails, 'vendorDetails')
    .where('vendorDetails.user_id =:userId', { userId: user.id })
    .select(['vendorDetails.zipcodeIds'])
    .getOne();
  const driver = driverRepo.create({
    orderType,
    vehicalNo,
    orderCapacity,
    user: userData,
    vendor: vendorsUser?.vendor,
    zipcodeIds: vendorsZipcodes?.zipcodeIds,
  });
  await driverRepo.save(driver);

  const mailService = new MailService();
  const mailBody = {
    text: 'vendor_registration',
    to: userData?.email,
    subject: 'Vendor Registration',
    fullname: userData?.fullName,
    mobileNo: `${userData?.countryCode}${userData?.mobileNumber}`,
    password: driverPassword,
  };
  mailService.send(mailBody);
  res.status(201).json(userData);
};

export const deleteDriverValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const removeDriver = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
    user: { id: userId },
  } = req;

  const userRepo = getRepository(Users);
  await userRepo.findOneOrFail({ where: { id } });

  await getManager().transaction(async (em) => {
    await em.softDelete(Documents, { user: id });
    await em.softDelete(UserAddresses, { user: id });
    await em.update(DriverDetails, { user: id }, { updatedBy: userId });
    await em.softDelete(DriverDetails, { user: id });
    await em.softDelete(Users, id);
  });
  res.sendStatus(204);
};

export const listCancellationReason = () => async (req: Request, res: Response): Promise<void> => {
  const { user } = req;
  const query = getManager()
    .createQueryBuilder(CancellationReasons, 'reasons')
    .select(['reasons.id', 'reasons.reason', 'reasons.userType'])
    .andWhere('reasons.userType = :userType', { userType: user.userType });

  const [resonse, count] = await query.getManyAndCount();
  res.status(200).json({ resonse, count });
};

export const cancelOrderValidation = {
  body: Joi.object({
    orderId: Joi.number().required(),
    reason: Joi.string().optional(),
    reasonType: Joi.number().optional(),
  }),
};
export const cancelOrder = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { orderId, reason, reasonType },
  } = req;

  const orderDetail = getCustomRepository(OrderDetailsRepository);
  const cancelOrderId = await orderDetail.findByIdOrFail(orderId);

  const cancelOrder = Object.assign({}, cancelOrderId, {
    cancellationReasonOther: reason,
    cancellationReason: reasonType,
    status: user.userType === PropaneUserType.USER ? 'cancelled' : `cancelled_By_${user.userType}`,
  });
  await orderDetail.save(cancelOrder);

  const notificationService = new SendPushNotificationService();

  const tokens = await getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .select(['orderDetail.id'])
    .where('orderDetail.id = :orderId', { orderId })
    .leftJoin('orderDetail.order', 'order')
    .addSelect(['order.id'])
    .leftJoin('order.user', 'user')
    .addSelect(['user.id', 'user.fullName'])
    .leftJoin('user.token', 'userTokens')
    .addSelect(['userTokens.deviceId'])
    .leftJoin('orderDetail.driver', 'driver')
    .addSelect(['driver.id'])
    .leftJoin('driver.token', 'driverTokens')
    .addSelect(['driverTokens.deviceId'])
    .leftJoin('orderDetail.vendor', 'vendor')
    .addSelect(['vendor.id'])
    .leftJoin('vendor.token', 'vendorTokens')
    .addSelect(['vendorTokens.deviceId'])
    .getRawOne();

  // TODO: order cancelled by driver
  if (user && user.userType === PropaneUserType.DRIVER) {
    const notificationRepo = getCustomRepository(NotificationsRepository);
    const notifications: Notification[] = [];
    for (let i = 0; i < 2; i++) {
      notifications[i] = notificationRepo.create({
        readedBy: [],
        deletedBy: [],
        isAdmin: false,
        fromId: user.id,
        toIds: i ? [tokens?.user_id] : [tokens?.vendor_id],
        notificationType: 1,
        title: `cancelled Order`,
        adminMessage: i
          ? notificationMessage(null, user.userType, reason)
          : notificationMessage(tokens.user_full_name, user.userType, reason),
        description: i
          ? notificationMessage(null, user.userType, reason)
          : notificationMessage(tokens.user_full_name, user.userType, reason),
      });

      try {
        await notificationService.execute({
          title: 'cancelled Order',
          description: i
            ? notificationMessage(null, user.userType, reason)
            : notificationMessage(tokens.user_full_name, user.userType, reason),
          notificationType: 1,
          tokens: i
            ? compact([tokens?.userTokens_device_id])
            : compact([tokens?.vendorTokens_device_id]),
        });
      } catch (error) {
        logger.error('Error while send notification');
      }
    }
    await notificationRepo.save(notifications);
  }

  // TODO: order cancelled by Admin
  if (user && user?.userType === (PropaneUserType.ADMIN || PropaneUserType.SUB_ADMIN)) {
    const notificationRepo = getCustomRepository(NotificationsRepository);

    const notificationToUser = notificationRepo.create({
      readedBy: [],
      deletedBy: [],
      isAdmin: false,
      fromId: user.id,
      toIds: [tokens?.user_id, tokens.driver_id, tokens.vendor_id],
      notificationType: 1,
      title: `cancelled Order`,
      adminMessage: notificationMessage(null, user.userType, null),
      description: notificationMessage(null, user.userType, null),
    });
    await notificationRepo.save(notificationToUser);

    try {
      await notificationService.execute({
        title: 'cancelled Order',
        description: notificationMessage(null, user.userType, null),
        notificationType: 1,
        tokens: compact([
          tokens?.userTokens_device_id,
          tokens.driverTokens_device_id,
          tokens.vendorTokens_device_id,
        ]),
      });
    } catch (error) {
      logger.error('Error while send notification');
    }
  }
  res.status(201).json({ cancelOrder });
};

export const updateDriverLocationValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  body: Joi.object({
    lat: Joi.number().required(),
    long: Joi.number().required(),
  }),
};
export const updateDriverLocation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { lat, long },
    params: { id },
  } = req;

  const driverRepository = getCustomRepository(DriverDetailsRepository);
  const driver = await driverRepository.findOneOrFail({ where: { user: id } });

  await driverRepository.update(driver.id, {
    lat,
    long,
  });

  res.sendStatus(204);
};

export const getAllDriverOptionsValodation = {
  query: Joi.object({
    isFreelancer: Joi.boolean().optional(),
    isFilters: Joi.boolean().optional(),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
  }),
};
export const getAllDriverOptions = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { isFreelancer, isFilters, vendorId },
  } = req;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .where('user.userType = :userType', { userType: PropaneUserType.DRIVER })
    .andWhere('user.isActive = :isActive', { isActive: true })
    .select(['user.id', 'user.fullName'])
    .leftJoin('user.driver', 'driver');

  if (isFilters) {
    if (isFreelancer) {
      query.andWhere('driver.vendor_id IS NULL');
    } else {
      query.andWhere('driver.vendor_id IS NOT NULL');
      if (vendorId && vendorId !== '') {
        query
          .leftJoin('driver.vendor', 'vendordetail')
          .innerJoin('vendordetail.user', 'vendorUser', 'vendorUser.id = :vendorId', { vendorId });
      }
    }
  }

  const [drivers, count] = await query.getManyAndCount();
  res.status(200).json({ drivers, count });
};

export const getDriversOrdersValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  query: Joi.object({
    endAt: Joi.date().optional(),
    startAt: Joi.date().optional(),
    status: Joi.alternatives(
      Joi.array()
        .items(Joi.alternatives(Joi.number().integer().min(0).optional(), Joi.string().optional()))
        .optional(),
      Joi.string()
        .valid(...Object.values(OrderStatus))
        .default(null),
    ),
    sort: Joi.string().valid('ASC', 'DESC').default('DESC'),
    sortBy: Joi.string().default('createdAt'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(20),
    search: Joi.string().max(50).default(null).optional(),
    orderType: Joi.number().integer().min(1).max(2).required(),
    categoryId: Joi.number().integer().default(null).optional(),
    customerId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
  }),
};
export const getDriversOrders = () => async (req: Request, res: Response): Promise<void> => {
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
      orderType,
      customerId,
      categoryId,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetails')
    .where('orderDetails.orderType = :orderType', { orderType })
    .andWhere('orderDetails.driver_id = :id', { id })
    .leftJoin('orderDetails.product', 'product')
    .addSelect(['product.id', 'product.name', 'product.logo'])
    .leftJoin('orderDetails.accessory', 'accessory')
    .addSelect(['accessory.id', 'accessory.name', 'accessory.image', 'accessory.description'])
    .leftJoin('orderDetails.category', 'category')
    .addSelect(['category.id', 'category.name'])
    .leftJoinAndSelect('orderDetails.order', 'order')
    .leftJoin('order.user', 'user')
    .leftJoin('order.userAddress', 'userAddress')
    .addSelect([
      'userAddress.countryCode',
      'userAddress.phoneNumber',
      'userAddress.addressType',
      'userAddress.houseNo',
      'userAddress.address',
      'userAddress.lat',
      'userAddress.long',
      'userAddress.fullName',
    ])
    .leftJoin('orderDetails.driver', 'driver')
    .leftJoin('orderDetails.vendor', 'vendor')
    .addSelect([
      'user.id',
      'driver.id',
      'vendor.id',
      'user.fullName',
      'user.mobileNumber',
      'user.countryCode',
      'user.profileImage',
      'vendor.fullName',
      'driver.fullName',
    ])
    .offset(offset)
    .limit(limit);

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
            startAt,
            endAt,
          })
          .orWhere(
            'orderDetails.scheduleDate >= :startAt AND orderDetails.scheduleDate <= :endAt',
            {
              startAt,
              endAt,
            },
          );
      }),
    );
  }

  if (categoryId && categoryId !== null) {
    query.andWhere('orderDetails.category_id = :categoryId', { categoryId });
  }

  if (status && status !== null) {
    query.andWhere('orderDetails.status = :status', { status });
  }

  if (status && Array.isArray(status)) {
    query.andWhere('orderDetails.status IN (:...status)', { status });
  }

  if (customerId && customerId !== null) {
    query.andWhere('user.id = :customerId', { customerId });
  }

  if (sort && sortBy === 'customer') {
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
    response.orders = orders.map((orderDetails) => {
      return {
        ...orderDetails,
        lat: orderDetails?.order?.lat,
        long: orderDetails?.order?.long,
        userId: orderDetails?.order?.userId,
        address: orderDetails?.order?.address,
        addressType: orderDetails?.order.userAddress?.addressType || '',
        addressName: orderDetails?.order.userAddress?.fullName || '',
        timeSlotsId: orderDetails?.order?.timeSlotsId,
        invoicedReceiptUrl: orderDetails?.order?.invoicedReceiptUrl,
        vendorName: orderDetails?.vendor?.fullName || '',
        driverName: orderDetails?.driver?.fullName || '',
        categoryName: orderDetails?.category?.name || '',
        isVendorsDriver: orderDetails?.driver?.driver?.vendorId ? 1 : 0,
        userName: orderDetails?.order?.user?.fullName,
        usermobileNumber: orderDetails?.order?.user?.mobileNumber,
        userCountryCode: orderDetails?.order?.user?.countryCode,
        userprofileImage: orderDetails?.order?.user?.profileImage,
        productName: orderDetails?.product?.name || orderDetails?.accessory?.name || '',
        productImage: orderDetails?.product?.logo || orderDetails?.accessory?.image || '',
        order: undefined,
        vendor: undefined,
        driver: undefined,
        category: undefined,
      };
    });
  }

  res.status(200).json({ ...response });
};
export const getDriverProfileByIdValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const getDriverProfileById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  let user = await getManager()
    .createQueryBuilder(Users, 'user')
    .where('user.id = :id', { id })
    .andWhere('user.userType = :userType', { userType: PropaneUserType.DRIVER })
    .leftJoinAndSelect('user.driver', 'driverDetails')
    .leftJoin('user.documents', 'documents')
    .addSelect(['documents.id', 'documents.documentUrl', 'documents.documentType'])
    .leftJoin('user.driverOrders', 'driverOrders', 'driverOrders.status IN (:...status)', {
      status: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    })
    .addSelect(['driverOrders.id', 'driverOrders.orderType', 'driverOrders.status'])
    .getOne();

  // remove password
  user = Object.assign({}, user, {
    password: undefined,
    orders: groupBy(flatMap(user?.driverOrders), 'orderType'),
    driverOrders: undefined,
  });

  res.status(200).json(user);
};

export const getFreelanceDriverPaymentValidation = {
  query: Joi.object({
    paymentStatus: Joi.number().optional().default(null),
    sortBy: Joi.string().default('fullName'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    search: Joi.string().max(50).allow(null).default(null),
  }),
};
export const getFreelanceDriverPayments = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    query: { search, paymentStatus, sort, sortBy, page, perPage },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(DriverDetails, 'driver')
    .select('driver.id')
    .groupBy('driver.user')
    .where('driver.vendor_Id IS NULL')
    .leftJoin('driver.user', 'user')
    .addSelect([
      'user.id',
      'user.email',
      'user.fullName',
      'user.countryCode',
      'user.mobileNumber',
      'user.profileImage',
    ])
    .andWhere('user.userType = :userType', { userType: PropaneUserType.DRIVER })
    .leftJoin('user.driverOrders', 'orderDetails')
    .addSelect('COALESCE(SUM(orderDetails.freelanceDriverReceivedAmount ), 0)', 'TotalAmount')
    .addSelect('SUM(orderDetails.status =  "delivered" )', 'completedOrder')
    .addGroupBy('orderDetails.driver')
    .leftJoin('orderDetails.order', 'orders')
    .leftJoin('user.freelanceDriversPayment', 'freelanceDriversPayment')
    .addSelect('COALESCE(SUM(freelanceDriversPayment.paidAmount ), 0)', 'paidAmount')
    .addSelect(
      '(COALESCE(SUM(orderDetails.freelanceDriverReceivedAmount ), 0) - COALESCE(SUM(freelanceDriversPayment.paidAmount ), 0)) AS `remainingAmounts`',
    )
    .addGroupBy('freelanceDriversPayment.driver');

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (sort && sortBy) {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC');
  }

  if (paymentStatus !== null) {
    if (Number(paymentStatus) === 0) {
      query.andHaving(
        'COALESCE(SUM(orderDetails.freelanceDriverReceivedAmount ), 0) - COALESCE(SUM(freelanceDriversPayment.paidAmount ), 0) > 0',
      );
    } else if (Number(paymentStatus) === 1) {
      query.andHaving(
        'COALESCE(SUM(orderDetails.freelanceDriverReceivedAmount ), 0) - COALESCE(SUM(freelanceDriversPayment.paidAmount ), 0) = 0',
      );
    }
  }

  let drivers = await query.getRawMany();
  const count = drivers.length;

  query.offset(offset);
  query.limit(limit);
  drivers = await query.getRawMany();

  res.status(200).json({ drivers, count });
};

export const driverLocationValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const driverLocation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const location = await getManager()
    .createQueryBuilder(DriverDetails, 'driverDetail')
    .select(['driverDetail.id', 'driverDetail.lat', 'driverDetail.long'])
    .innerJoin('driverDetail.user', 'user', 'user.id = :id', { id })
    .getOne();

  res.json(location);
};

export const updateDriverStatusValidation = {
  body: Joi.object({
    isOnline: Joi.boolean().required(),
  }),
};
export const updateDriveratus = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { isOnline },
  } = req;

  const driverRepository = getCustomRepository(DriverDetailsRepository);
  const driver = await driverRepository.findOneOrFail({ where: { user } });

  await driverRepository.update(driver.id, {
    isOnline,
  });

  res.sendStatus(204);
};

export const driverSwipeOrderValidation = {
  body: Joi.object({
    orderId: Joi.number().required(),
    status: Joi.string().required(),
    imageOne: Joi.string().optional(),
    imageTwo: Joi.string().optional(),
  }),
};
export const driverSwipeOrder = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: driverId },
    body: { orderId, status, imageOne, imageTwo },
  } = req;
  const orderDetailRepo = getCustomRepository(OrderDetailsRepository);
  const orderDetail = await orderDetailRepo.findOneOrFail({
    where: { driver: driverId, id: orderId },
  });

  await orderDetailRepo.save(
    Object.assign({}, orderDetail, {
      status,
      updatedBy: driverId,
      imageOne,
      imageTwo,
    }),
  );

  const tokens = await getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .select(['orderDetail.id'])
    .where('orderDetail.id = :orderId', { orderId })
    .leftJoin('orderDetail.order', 'order')
    .leftJoin('order.user', 'user')
    .leftJoin('user.token', 'userTokens')
    .addSelect(['userTokens.deviceId'])
    .leftJoin('orderDetail.vendor', 'vendor')
    .leftJoin('vendor.vendor', 'vendorDetail')
    .leftJoin('vendor.token', 'vendorTokens')
    .addSelect(['vendorTokens.deviceId'])
    .getRawOne();

  if (tokens && (tokens?.userTokens_device_id || tokens?.vendorTokens_device_id)) {
    const notificationService = new SendPushNotificationService();
    const notificationRepo = getCustomRepository(NotificationsRepository);

    const notificationToUser = notificationRepo.create({
      readedBy: [],
      deletedBy: [],
      isAdmin: false,
      fromId: driverId,
      toIds: [tokens?.userTokens_device_id, tokens?.vendorTokens_device_id],
      notificationType: 1,
      title: `${status || '-'} Order`,
      adminMessage: `Your order is ${status || '-'} by driver`,
      description: `Your order is ${status || '-'} by driver`,
    });
    await notificationRepo.save(notificationToUser);

    try {
      await notificationService.execute({
        title: `${status} Order`,
        description: `Your order is ${status || '-'} by driver`,
        notificationType: 1,
        tokens: compact([tokens?.userTokens_device_id, tokens?.vendorTokens_device_id]),
      });
    } catch (error) {
      logger.error('Error while send notification');
    }
  }
  res.sendStatus(204);
};

export const driversList = () => async (req: Request, res: Response): Promise<void> => {
  const { user } = req;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select(['user.id', 'user.fullName', 'user.profileImage'])
    .where('user.userType = :userType', { userType: PropaneUserType.DRIVER })
    .leftJoin('user.driver', 'drivers')
    .addSelect(['drivers.vehicalNo'])
    .leftJoin('user.driverOrders', 'driverOrders')
    .addSelect(['driverOrders.vendor'])
    .where('driverOrders.vendor = :vendor', { vendor: user?.id })
    .groupBy('user.id');

  let drivers = await query.getRawMany();
  let curr = 0;
  drivers = drivers.map((driver) => {
    curr++;
    return { ...driver, id: curr };
  });
  const count = await query.getCount();

  res.status(200).json({ drivers, count });
};

export const emergencyOrderValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};

export const emergencyOrder = () => async (req: Request, res: Response): Promise<void> => {
  const { user } = req;
  await getConnection()
    .createQueryBuilder()
    .update(OrderDetails)
    .set({
      status: OrderStatus.EMERGENCY_ORDER,
      driver: null,
    })
    .where({ driver: user })
    .andWhere({ status: Not(OrderStatus.CANCELLED_BY_ADMIN) })
    .andWhere({ status: Not(OrderStatus.CANCELLED_BY_DRIVER) })
    .andWhere({ status: Not(OrderStatus.CANCELLED) })
    .andWhere({ status: Not(OrderStatus.DELIVERED) })
    .execute();

  res.send({ message: 'emergency order added.' });
};

export const cancellOrderList = () => async (req: Request, res: Response): Promise<void> => {
  const { user } = req;
  const query = getManager()
    .createQueryBuilder(OrderDetails, 'OrderDetails')
    .select([
      'OrderDetails.id',
      'OrderDetails.createdAt',
      'OrderDetails.scheduleDate',
      'OrderDetails.status',
    ])
    .where('OrderDetails.driver = :driver', { driver: user?.id })
    .andWhere('OrderDetails.status = :status', { status: OrderStatus.CANCELLED_BY_DRIVER })

    .leftJoin('OrderDetails.order', 'order')
    .addSelect(['order.id'])
    .leftJoin('order.user', 'user')
    .addSelect(['user.fullName', 'user.countryCode', 'user.mobileNumber', 'user.profileImage'])
    .leftJoin('order.userAddress', 'address')
    .addSelect([
      'address.fullName',
      'address.countryCode',
      'address.phoneNumber',
      'address.addressType',
      'address.address',
      'address.lat',
      'address.long',
    ]);

  const cancelledOrder = await query.getRawMany();
  const count = await query.getCount();

  res.status(200).json({ cancelledOrder, count });
};

export const todaysOrder = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { lat, long },
  } = req;
  // const todaysOrder = await getManager()
  //   .createQueryBuilder(OrderDetails, 'orderDetails')
  //   .andWhere(
  //     'orderDetails.status IN (:...status) AND orderDetails.schedule_date >= :startAt AND orderDetails.schedule_date <= :endAt AND orderDetails.driver_id = :driverId',
  //     {
  //       startAt: momentTimeZone.tz(new Date(), 'America/New_York').startOf('day').format(),
  //       endAt: momentTimeZone.tz(new Date(), 'America/New_York').endOf('day').format(),
  //       status: [
  //         OrderStatus.PENDING,
  //         OrderStatus.REFILLED,
  //         OrderStatus.EMERGENCY_ORDER,
  //         OrderStatus.RESCHEDULED,
  //       ],
  //       driverId: user.id,
  //     },
  //   )
  //   .leftJoin('orderDetails.order', 'order')
  //   .addSelect(['order.lat', 'order.long'])
  //   .getMany();

  const todaysOrder = await getManager()
    .createQueryBuilder(OrderDetails, 'orderdetail')
    .select([
      'orderdetail.id',
      'orderdetail.orderType',
      'orderdetail.scheduleDate',
      'orderdetail.createdAt',
      'orderdetail.startTime',
      'orderdetail.endTime',
      'orderdetail.qty',
      'orderdetail.status',
      'orderdetail.subTotal',
      'orderdetail.deliveryFees',
      'orderdetail.serviceFee',
      'orderdetail.serviceCharge',
      'orderdetail.leakageFee',
      'orderdetail.grandTotal',
      'orderdetail.locationFee',
      'orderdetail.salesTaxAmount',
      'orderdetail.promocodeDiscountAmount',
    ])
    .leftJoin('orderdetail.product', 'product')
    .addSelect(['product.id', 'product.name', 'product.logo'])
    .leftJoin('orderdetail.category', 'category')
    .addSelect(['category.id', 'category.name'])
    .leftJoin('orderdetail.cylinderSize', 'cylinderSize')
    .addSelect(['cylinderSize.id', 'cylinderSize.cylinderSize'])
    .leftJoin('orderdetail.accessory', 'accessory')
    .addSelect(['accessory.id', 'accessory.name'])
    .where('orderdetail.driver=:driverId', { driverId: user.id })
    .leftJoin('orderdetail.order', 'order')
    .addSelect(['order.lat', 'order.long'])
    .leftJoin('order.user', 'user')
    .addSelect(['user.fullName', 'user.mobileNumber', 'user.profileImage'])
    .leftJoin('order.userAddress', 'address')
    .addSelect(['address.id', 'address.addressType', 'address.address'])
    .andWhere('orderdetail.scheduleDate BETWEEN :startAt AND :endAt', {
      startAt: momentTimeZone.tz(new Date(), 'America/New_York').startOf('day').format(),
      endAt: momentTimeZone.tz(new Date(), 'America/New_York').endOf('day').format(),
    })
    .getRawMany();

  const driverRepository = getCustomRepository(DriverDetailsRepository);
  let driver = await driverRepository.findOneOrFail({ where: { user } });

  if (!driver.lat && !driver.long && lat && long) {
    await driverRepository.update(driver.id, { lat: Number(lat), long: Number(long) });
  }
  driver = await driverRepository.findOneOrFail({ where: { user } });

  const latLong: LatLong[] = [];
  if (!driver?.lat || !driver?.long) throw new Error('Lat and Long must be present for driver.');
  latLong.push({ sourceId: 0, lat: driver.lat, long: driver.long });
  const todaysOrderMap: Map<number, OrderDetails> = new Map();
  for (let i = 0; i < todaysOrder?.length; i++) {
    if (!todaysOrder[i]?.order_lat || !todaysOrder[i]?.order_long)
      throw new Error('Lat and Long must be present in order');

    latLong.push({
      sourceId: i + 1,
      lat: Number(todaysOrder[i]?.order_lat),
      long: Number(todaysOrder[i]?.order_long),
    });
    todaysOrder[i] = ({ ...todaysOrder[i], sourceId: i + 1 } as unknown) as OrderDetails;
    todaysOrderMap.set(i + 1, todaysOrder[i]);
  }
  const pathIds: number[] = new DriverOptimalPath().execute(latLong);
  const minCostPathOrder: OrderDetails[] = pathIds.map((id: number) => todaysOrderMap.get(id));

  res.send({
    orders: minCostPathOrder,
  });
};

export const updateDriverActivationValidation = {
  body: Joi.object({
    isActive: Joi.boolean().required(),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
  }),
};
export const updateDriverActivation = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { isActive, driverId },
  } = req;

  const UserRepository = getCustomRepository(UsersRepository);
  const driver = await UserRepository.findOneOrFail({ where: { id: driverId } });

  await UserRepository.update(driver.id, {
    isActive,
    updatedBy: user?.id,
  });

  res.sendStatus(204);
};
