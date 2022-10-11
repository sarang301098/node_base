import {
  getManager,
  getRepository,
  FindConditions,
  In,
  Brackets,
  getCustomRepository,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { compact, omit, sumBy, uniq, get, countBy, flatMap } from 'lodash';

import logger from '../service/log';
import GetCart from '../service/GetCart';
import { MailService } from '../service/Mail';
import SendPushNotificationService from '../service/notification';
import StripeOrderPaymentService from '../service/StripeOrderPayment';

import { BadRequestError, NotFoundError } from '../error';

import { Cart } from '../model/Cart';
import { Users } from '../model/Users';
import { Tokens } from '../model/Tokens';
import { Orders } from '../model/Orders';
import { TimeSlots } from '../model/TimeSlots';
import { OrderDetails } from '../model/OrderDetails';
import { Notification } from '../model/Notification';
import { UserAddresses } from '../model/UserAddress';
import { OrderStatusLogs } from '../model/OrderStatusLogs';
import { UserOrderStatistics } from '../model/UserOrderStatistics';

import { OrderStatus, PropaneUserType } from '../constants';
import { NotificationsRepository } from '../repository/Notifications';
import { OrderDetailsRepository } from '../repository/OrdersDetail';
import { OrdersRepository } from '../repository/Orders';
import config from '../config';
import { SplitPayment, StripeSplitPayment } from '../service/SplitPayment';

export const getAllrdersValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    orderType: Joi.number().integer().min(0).max(4).optional().default(null),
    search: Joi.string().max(50).default(null).optional(),
    categoryId: Joi.number().integer().optional(),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    freelanceDriverId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    status: Joi.array()
      .items(Joi.alternatives(Joi.number().integer().min(0).optional(), Joi.string().optional()))
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().valid('customer', 'vendor', 'driver').default('customer'),
  }),
};
export const getAllOrders = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: {
      sort,
      page,
      endAt,
      status,
      search,
      sortBy,
      perPage,
      startAt,
      driverId,
      vendorId,
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
    .leftJoinAndSelect('orderDetails.order', 'order')
    .leftJoin('order.user', 'user')
    .leftJoin('orderDetails.driver', 'driver')
    .leftJoinAndSelect('driver.driver', 'driverDetails') // TODO: remove leftJoinAndSelect and select only usable fields.
    .leftJoin('orderDetails.vendor', 'vendor')
    .addSelect([
      'user.id',
      'driver.id',
      'vendor.id',
      'user.fullName',
      'vendor.fullName',
      'driver.fullName',
    ])
    .offset(offset)
    .limit(limit);

  if (orderType && orderType !== null) {
    query.andWhere('orderDetails.orderType = :orderType', { orderType });
  }

  if (status && Array.isArray(status)) {
    query.andWhere('orderDetails.status IN (:...status)', { status });
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
        return qb.orWhere(
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

  if (sort && sortBy === 'driver') {
    query.orderBy('driver.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'vendor') {
    query.orderBy('vendor.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'customer') {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC');
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
        vendorName: orderDetails?.vendor?.fullName,
        customerName: orderDetails?.order?.user?.fullName || '',
        driverName: orderDetails?.driver?.fullName || '',
        categoryName: orderDetails?.category?.name || '',
        timeSlotsId: orderDetails?.order?.timeSlotsId,
        invoicedReceiptUrl: orderDetails?.order?.invoicedReceiptUrl,
        isVendorsDriver: orderDetails?.driver?.driver?.vendorId ? 1 : 0,
        order: undefined,
        vendor: undefined,
        driver: undefined,
        category: undefined,
      };
    });
  }

  res.status(200).json({ ...response });
};

export const getUsersOrderValidation = {
  query: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    orderType: Joi.number().integer().default(null),
    categoryId: Joi.number().integer().optional(),
    status: Joi.string().optional().default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
  }),
};
export const getUsersOrder = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id },
    query: { page, perPage, orderType, categoryId, startDate, endDate, status },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Orders, 'orderMaster')
    .leftJoinAndSelect('orderMaster.details', 'order')
    .leftJoin('orderMaster.user', 'user')
    .where('user.id = :id', { id })
    .leftJoin('order.product', 'product')
    .leftJoin('product.details', 'productDetails')
    .leftJoin('order.location', 'location')
    .leftJoin('order.cylinderSize', 'cylinderSize')
    .leftJoin('order.category', 'category')
    .addSelect(['category.id', 'category.name'])
    .leftJoin('order.accessory', 'accessory')
    .leftJoin('order.promocodes', 'promocodes')
    .offset(offset)
    .limit(limit);

  if (orderType) {
    query.andWhere('order.orderType = :orderType', { orderType });
  }

  if (categoryId) {
    query.andWhere('category.id = :categoryId', { categoryId });
  }

  if (startDate && endDate) {
    query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
  }

  if (status && status !== null && status !== '') {
    query.andWhere('order.status = :status', { status });
  }

  const [orders, count] = await query.getManyAndCount();

  res.status(200).json({ orders, count });
};

export const getOrderByIdValidation = {
  query: Joi.object({
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('fullName'),
  }),
  params: Joi.object({
    id: Joi.number().integer().min(0).required(),
  }),
};
export const getOrderById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { sort, sortBy },
    params: { id },
  } = req;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .where('orderDetail.id = :id', { id })
    .leftJoinAndSelect('orderDetail.order', 'orders')
    .leftJoin('orders.user', 'customer')
    .addSelect([
      'customer.id',
      'customer.email',
      'customer.fullName',
      'customer.countryCode',
      'customer.mobileNumber',
      'customer.profileImage',
      'customer.userSubscriptionCount',
    ])
    .leftJoin('orders.userAddress', 'userAddress')
    .addSelect([
      'userAddress.id',
      'userAddress.lat',
      'userAddress.long',
      'userAddress.city',
      'userAddress.state',
      'userAddress.county',
      'userAddress.country',
      'userAddress.houseNo',
      'userAddress.address',
      'userAddress.fullName',
      'userAddress.isDefault',
      'userAddress.addressType',
      'userAddress.countryCode',
      'userAddress.phoneNumber',
    ])
    .leftJoin('userAddress.zipCode', 'zipCodes')
    .addSelect(['zipCodes.id', 'zipCodes.zipcode', 'zipCodes.areaName'])
    .leftJoin('orderDetail.vendor', 'vendor')
    .addSelect([
      'vendor.id',
      'vendor.fullName',
      'vendor.email',
      'vendor.countryCode',
      'vendor.mobileNumber',
      'vendor.profileImage',
    ])
    .leftJoin('orderDetail.driver', 'driver')
    .addSelect([
      'driver.id',
      'driver.email',
      'driver.fullName',
      'driver.countryCode',
      'driver.mobileNumber',
      'driver.profileImage',
      'driver.createdAt',
    ])
    .leftJoin('driver.driver', 'driverDetails')
    .addSelect([
      'driverDetails.id',
      'driverDetails.identity',
      'driverDetails.vehicalNo',
      'driverDetails.licenceNo',
      'driverDetails.personalId',
      'driverDetails.driverVehicle',
      'driverDetails.orderCapacity',
      'driverDetails.idInformation',
    ])
    .leftJoin('orderDetail.product', 'products')
    .addSelect(['products.id', 'products.logo', 'products.name'])
    .leftJoin('products.details', 'productDetails')
    .addSelect(['productDetails.id', 'productDetails.indexPrice', 'productDetails.discount'])
    .leftJoin('orderDetail.orderLogs', 'orderLogs')
    .addSelect(['orderLogs.status', 'orderLogs.createdAt', 'orderLogs.updatedAt'])
    .leftJoin('orderDetail.category', 'category')
    .addSelect(['category.id', 'category.name', 'category.orderType'])
    .leftJoin('orderDetail.accessory', 'accessory')
    .addSelect(['accessory.name', 'accessory.image', 'accessory.price', 'accessory.description'])
    .leftJoin('orderDetail.cylinderSize', 'cylinderSize')
    .addSelect(['cylinderSize.id', 'cylinderSize.cylinderSize'])
    .leftJoin('orderDetail.location', 'location')
    .addSelect(['location.id', 'location.name', 'location.price', 'location.description'])
    .leftJoin('orderDetail.rating', 'rating')
    .addSelect(['rating.id', 'rating.rating', 'rating.review'])
    .leftJoin('orderDetail.promocodes', 'promocodes')
    .addSelect(['promocodes.id', 'promocodes.title', 'promocodes.promocode', 'promocodes.discount'])
    .leftJoin('orderDetail.cancellationReason', 'cancellationReason')
    .addSelect(['cancellationReason.id', 'cancellationReason.reason'])
    .leftJoin('orders.timeSlot', 'timeSlot')
    .addSelect(['timeSlot.id', 'timeSlot.startTime', 'timeSlot.endTime']);

  // Get Drivers By Logs
  const getDriverQuery = getManager()
    .createQueryBuilder(OrderStatusLogs, 'log')
    .innerJoin('log.order', 'order', 'order.id = :id', { id })
    .innerJoin('log.user', 'users', 'users.userType = :userType', {
      userType: PropaneUserType.DRIVER,
    });

  const order = await query.getOne();
  const driverDetail = await getDriverQuery.getMany();
  const driverIds = uniq(
    compact([...(driverDetail || []).map((log) => log?.userId), order?.driverId]),
  );

  let getAlldriversQuery;
  let drivers;

  if (driverIds && driverIds.length) {
    getAlldriversQuery = getManager()
      .createQueryBuilder(Users, 'users')
      .select([
        'users.id',
        'users.email',
        'users.fullName',
        'users.countryCode',
        'users.mobileNumber',
        'users.profileImage',
        'users.createdAt',
      ])
      .where('users.id IN (:...driverIds)', { driverIds })
      .innerJoin('users.driver', 'driver')
      .addSelect([
        'driver.id',
        'driver.identity',
        'driver.vehicalNo',
        'driver.licenceNo',
        'driver.personalId',
        'driver.driverVehicle',
        'driver.orderCapacity',
        'driver.idInformation',
        'driver.orderType',
      ])
      .loadRelationCountAndMap('users.completedOrderCount', 'users.driverOrders', 'co', (qb) =>
        qb.andWhere('co.status IN (:...status)', { status: [OrderStatus.DELIVERED] }),
      )
      .leftJoin('users.driverOrders', 'orders', 'orders.status IN (:...status)', {
        status: [OrderStatus.DELIVERED],
      })
      .addSelect(['orders.id', 'orders.orderType']);

    if (sort && sortBy) {
      query.orderBy('users.fullName', sort as 'ASC' | 'DESC');
    }

    drivers = await getAlldriversQuery.getMany();

    if (drivers && drivers.length) {
      drivers = drivers.map((driver) => {
        return {
          ...driver,
          orders: countBy(flatMap(driver?.driverOrders), 'orderType'),
          driverOrders: undefined,
        };
      });
    }
  }

  res.status(200).json({ order, drivers });
};

export const createOrderValidation = {
  body: Joi.object({
    promocodeId: Joi.number().optional(),
    stripeCardId: Joi.string().required(),
    promocodeAppliedCartId: Joi.number().optional(),
    addressId: Joi.number().integer().min(1).optional(),
    checkForleakage: Joi.boolean().optional().default(false),
  }),
};
export const createOrder = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { promocodeId, promocodeAppliedCartId, stripeCardId, addressId, checkForleakage },
  } = req;

  const ordersRepo = getRepository(Orders);
  const userAddressRepo = getRepository(UserAddresses);
  const orderDetailsRepo = getRepository(OrderDetails);
  const orderStatusLogsRepo = getRepository(OrderStatusLogs);
  const userOrderStatsRepo = getRepository(UserOrderStatistics);

  const cartService = new GetCart();
  const data = await cartService.execute({
    userId: user?.id,
    isOrder: true,
    promocodeId,
    promocodeAppliedCartId,
    checkForleakage,
  });

  let { orderDetails } = data;

  if (!(orderDetails && orderDetails.length)) {
    throw new BadRequestError('Cart is empty', 'EMPTY_CART');
  }

  const splitPaymentData: SplitPayment[] = [];

  for (let i = 0; i < orderDetails.length; i++) {
    splitPaymentData.push({
      amount: Math.ceil(orderDetails[i]?.vendorReceivedAmount as number),
      destination: orderDetails[i]?.vendor?.stripeAccountId,
    });
  }

  const grandTotal = sumBy(orderDetails, 'grandTotal');
  const cartIds = (orderDetails || []).map((detail) => detail.id);

  let where: FindConditions<UserAddresses> = {};

  if (addressId) where = { ...where, id: addressId };
  else where = { ...where, isDefault: true, user };

  const address = await userAddressRepo.findOne({ where });
  if (!address) throw new NotFoundError('Default address not found', 'DEFAULT_ADDRESS_NOT_FOUND');

  let order = ordersRepo.create({
    user,
    lat: address?.lat,
    long: address?.long,
    createdBy: user?.id,
    updatedBy: user?.id,
    userAddress: address,
    address: address?.address,
  });
  order = await ordersRepo.save(order);

  // TODO: manage relations
  try {
    orderDetails = orderDetails.map((details) =>
      omit(Object.assign({}, { ...details, order, status: OrderStatus.PENDING }), ['id']),
    );

    orderDetails = await orderDetailsRepo.save(orderDetails);

    order = Object.assign({}, order, {
      grandTotal,
      vendorTotalDeliveryfee: sumBy(orderDetails, 'vendorDeliveryFee'),
      adminTotalDeliveryFee: sumBy(orderDetails, ''), // TODO: didn't get the field.
    });
    order = await ordersRepo.save(order);
  } catch (error) {
    await ordersRepo.delete(order?.id);
    throw new BadRequestError('Order details creation error', 'ORDERDETAILS_CREATE_FAILED');
  }

  /*
   ** Filter response Data.
   ** TODO: Remove if not needed.
   */
  orderDetails =
    orderDetails &&
    orderDetails.map((detail) => {
      return Object.assign({}, detail, {
        order: undefined,
        product: undefined,
        vendor: undefined,
        location: undefined,
        category: undefined,
        accessory: undefined,
        promocodes: undefined,
        cylinderSize: undefined,
      });
    });
  order = Object.assign({}, order, { user: undefined });

  // TODO: remove any in future.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderLogs: any = (orderDetails || []).map((detail) => {
    return {
      user,
      order: detail,
      createdBy: user?.id,
      updatedBy: user?.id,
      status: OrderStatus.PENDING,
    };
  });
  orderLogs = await orderStatusLogsRepo.save(orderLogs);

  await getManager().transaction(async (em) => {
    await em.update(Cart, cartIds, { updatedBy: user?.id });
    await em.softDelete(Cart, cartIds);
  });

  const orderDetailIds = (orderDetails || []).map((detail) => detail?.id || '');
  let vendorIds: Array<string> = compact(get(orderDetails, 'vendorId'));

  // for userstatistics
  const mappedIds = new Map();
  if (vendorIds && vendorIds.length) {
    mappedIds.set(user?.id, 1);
    vendorIds.forEach((element) => {
      mappedIds.set(element, (mappedIds.get(element) || 0) + 1);
    });
  }

  // make it uniq.
  vendorIds = uniq(vendorIds);
  const tokensRepo = getRepository(Tokens);
  const vendorTokens = await tokensRepo.find({ where: { user: In(vendorIds) } });
  const tokens: Array<string> = get(vendorTokens, 'deviceId');

  // notifications sending to the vendor.
  let notification;
  const notificationRepo = getRepository(Notification);
  try {
    notification = notificationRepo.create({
      toIds: [...vendorIds],
      readedBy: [],
      deletedBy: [],
      isAdmin: false,
      fromId: user?.id,
      notificationType: 1,
      title: 'Order Placed',
      description: `Order is placed by ${user?.fullName || '-'}`,
      adminMessage: `Order is placed by ${user?.fullName || '-'}`,
    });
    notification = await notificationRepo.save(notification);

    if (tokens && tokens.length) {
      try {
        const notificationService = new SendPushNotificationService();
        await notificationService.execute({
          tokens,
          title: 'Order Placed',
          description: `Order is placed by ${user?.fullName}`,
        });
      } catch (error) {
        await notificationRepo.delete(notification?.id);
        logger.error('Error while sending the notification');
      }
    }
  } catch (error) {
    await notificationRepo.delete(notification?.id || '');
  }

  // payment integration of order
  try {
    const service = new StripeOrderPaymentService();
    const payment = await service.execute({
      stripeCardId,
      confirm: true,
      isOrder: true,
      orderDetailIds,
      currency: 'usd',
      userId: user?.id,
      email: user?.email,
      orderId: order?.id,
      amount: Math.ceil(data.grandTotal ? data.grandTotal : 0),
      stripeCustomerId: user?.stripeCustomerId,
    });
    const stripeSplitPaymentService = new StripeSplitPayment();

    for (let i = 0; i < splitPaymentData.length; i++) {
      const split = await stripeSplitPaymentService.splitPayment(splitPaymentData[i]);
      await orderDetailsRepo.update(orderDetails[i].id, {
        isPaid: true,
        isRefunded: false,
        stripePaymentIntentId: payment.PaymentIntent.id,
        stripePaymentTransferId: split.id,
      });
    }
    await ordersRepo.update(order?.id, {
      serviceFee: data.serviceFee,
      serviceCharge: data.serviceCharge,
      grandTotal: data.grandTotal,
      stripePaymentIntentId: payment.PaymentIntent.id,
    });
  } catch (error) {
    await orderStatusLogsRepo.delete((orderLogs || []).map((logs: OrderStatusLogs) => logs?.id));
    await orderDetailsRepo.delete(orderDetailIds);
    await ordersRepo.delete(order?.id);
    await getManager().transaction(async (em) => {
      await em.update(Cart, cartIds, { updatedBy: user?.id });
      await em.restore(Cart, cartIds);
    });
    throw new BadRequestError('Error in payment');
  }
  const orderQty = orderDetails.map((qty) => qty.qty);
  const promocode = orderDetails.map((promocode) => promocode.promocode);
  // Mailing to appropriate users
  try {
    const mailService = new MailService();
    const mailBody = {
      to: `${user?.email}, ${config.ADMIN_CONTACT_EMAIL}`,
      email: user?.email,
      text: 'order_place',
      subject: 'Order Place',
      actor: user?.userType,
      fullname: user?.fullName,
      mobileNo: `${user?.countryCode}${user?.mobileNumber}`,
      orderId: order?.id.toString(),
      address: order?.address,
      qty: orderQty.toString(),
      deliverFee: data?.deliveryFee.toString(),
      salesTax: data?.salesTaxAmount.toString(),
      serviceFee: data?.serviceFee.toString(),
      serviceCharge: data?.serviceCharge.toString(),
      promocode: promocode.toString() || '0',
      promocodeDiscount: data?.promocodeDiscount.toString(),
      total: data?.grandTotal.toString(),
    };
    await mailService.send(mailBody);
  } catch (error) {
    logger.error('Error in sending the mail');
  }

  // Order Statistics
  // TODO: Remove if not needed.
  for (const [key, value] of mappedIds.entries()) {
    await userOrderStatsRepo.update({ user: key }, { noOfOrders: () => `noOfOrders + ${value}` });
  }
  await getManager().getRepository(Users).update(user?.id, { lastPurchaseDate: new Date() });
  res.status(201).json({ data: { ...data, orderId: order.id } });
};

export const updateOrderValidation = {
  body: Joi.object({
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .required(),
    imageOne: Joi.string().min(1).optional(),
    imageTwo: Joi.string().min(1).optional(),
    reason: Joi.string().min(1).optional(),
  }),
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const updateOrder = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { status, imageOne, imageTwo, reason },
    params: { id },
  } = req;

  const orderDetailsRepo = getRepository(OrderDetails);
  const order = await orderDetailsRepo.findOneOrFail(id);

  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.CANCELLED_BY_ADMIN ||
    order.status === OrderStatus.CANCELLED_BY_DRIVER
  ) {
    throw new Error("You can't update status of cancelled order.");
  }

  if (
    !order.isRefunded &&
    (status === OrderStatus.CANCELLED ||
      status === OrderStatus.CANCELLED_BY_ADMIN ||
      status === OrderStatus.CANCELLED_BY_DRIVER)
  ) {
    const service = new StripeOrderPaymentService();
    const stripeSplitPaymentService = new StripeSplitPayment();

    const paymentIntent = await service.getPaymentInfo(order?.stripePaymentIntentId);
    if (paymentIntent.amount_received <= 0) {
      throw new Error('Payment is not completed.');
    }
    await stripeSplitPaymentService.splitPaymentRefund(order?.stripePaymentTransferId);
    await service.refundPayment(
      order?.stripePaymentIntentId,
      Number(order?.refundAmount.toFixed(2)),
    );
    await orderDetailsRepo.update(id, {
      isPaid: false,
      isRefunded: true,
      status: status,
      updatedBy: user?.id,
    });
  } else {
    if (imageOne) order.imageOne = imageOne as string;
    if (imageTwo) order.imageTwo = imageTwo as string;
    if (reason && user?.userType === (PropaneUserType.ADMIN || PropaneUserType.SUB_ADMIN))
      order.cancellationReasonOther = reason as string;

    await orderDetailsRepo.save(
      Object.assign({}, order, {
        status,
        updatedBy: user?.id,
      }),
    );

    if (status !== order?.status) {
      const orderStatusLogsRepo = getRepository(OrderStatusLogs);
      const orderLogs = orderStatusLogsRepo.create({
        user,
        order,
        status,
        createdBy: user?.id,
        updatedBy: user?.id,
      });
      await orderStatusLogsRepo.save(orderLogs);
    }
  }

  res.sendStatus(200);
};

export const deleteOrdersValidation = {
  params: Joi.object({ id: Joi.number().min(0).required() }),
};
export const removeOrders = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const orderDetailsRepo = getRepository(OrderDetails);
  const order = await orderDetailsRepo.findOneOrFail(id);

  const service = new StripeOrderPaymentService();
  const stripeSplitPaymentService = new StripeSplitPayment();

  const paymentIntent = await service.getPaymentInfo(order?.stripePaymentIntentId);
  if (paymentIntent.amount_received <= 0) {
    throw new Error('Payment is not completed.');
  }
  await stripeSplitPaymentService.splitPaymentRefund(order?.stripePaymentTransferId);
  await service.refundPayment(order?.stripePaymentIntentId, order?.refundAmount);

  await getManager().transaction(async (em) => {
    await em.update(OrderDetails, { id }, { updatedBy: userId, isPaid: false, isRefunded: true });
    await em.softDelete(OrderDetails, id);
  });

  res.sendStatus(204);
};

export const restoreOrdersValidation = {
  params: Joi.object({ id: Joi.number().min(0).required() }),
};
export const restoreOrders = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(OrderDetails, { id }, { updatedBy: userId });
    await em.restore(OrderDetails, id);
  });

  res.sendStatus(204);
};

export const orderRescheduleValidation = {
  body: Joi.object({
    scheduleDate: Joi.date().greater(new Date()).required(),
    timeSlotsId: Joi.number().min(0).required(),
  }),
  params: Joi.object({ id: Joi.number().min(0).required() }),
};

export const orderReschedule = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { scheduleDate, timeSlotsId },
    params: { id },
  } = req;

  const orderDetailsRepo = getCustomRepository(OrderDetailsRepository);
  const orderRepo = getCustomRepository(OrdersRepository);
  const orderStatusLogsRepo = getRepository(OrderStatusLogs);
  const timeSlotsRepo = getRepository(TimeSlots);

  const timeslotById = await timeSlotsRepo.findOneOrFail(timeSlotsId);
  const orderExist = await orderDetailsRepo.findOneOrFail(id);

  await orderDetailsRepo.update(id, {
    scheduleDate,
    updatedBy: user.id,
    createdBy: user?.id,
    endTime: timeslotById?.endTime,
    startTime: timeslotById?.startTime,
    status: OrderStatus.RESCHEDULED,
    driver: null,
  });

  await orderRepo.update(orderExist.orderId, {
    timeSlot: timeslotById,
    createdBy: user?.id,
    updatedBy: user.id,
  });

  const orderStatusLogs = orderStatusLogsRepo.create({
    user,
    order: orderExist,
    status: OrderStatus.RESCHEDULED,
    createdBy: user?.id,
    updatedBy: user?.id,
  });
  await orderStatusLogsRepo.save(orderStatusLogs);

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetail')
    .select(['orderDetail.id', 'orderDetail.scheduleDate'])
    .where('orderDetail.id = :id', { id })
    .leftJoin('orderDetail.order', 'order')
    .addSelect(['order.id'])
    .leftJoin('order.timeSlot', 'timeSlot')
    .addSelect(['timeSlot.id', 'timeSlot.startTime', 'timeSlot.endTime'])
    .leftJoin('order.user', 'user')
    .addSelect(['user.id', 'user.fullName'])
    .leftJoin('user.token', 'tokens')
    .addSelect(['tokens.id', 'tokens.deviceId'])
    .leftJoin('orderDetail.driver', 'driver')
    .addSelect(['driver.id', 'driver.fullName'])
    .leftJoin('driver.token', 'dTokens')
    .addSelect(['dTokens.id', 'dTokens.deviceId'])
    .leftJoin('orderDetail.vendor', 'vendor')
    .addSelect(['vendor.id', 'vendor.fullName'])
    .leftJoin('vendor.vendor', 'vendorDetail')
    .addSelect(['vendorDetail.id', 'vendorDetail.businessName'])
    .leftJoin('vendor.token', 'vTokens')
    .addSelect(['vTokens.id', 'vTokens.deviceId']);

  const orders = await query.getOne();

  const notificationRepo = getCustomRepository(NotificationsRepository);
  const notificationService = new SendPushNotificationService();
  // TODO: Vendor and driver send notification
  if (orders && orders?.driver?.token && orders?.vendor?.token) {
    const notificationToUser = notificationRepo.create({
      readedBy: [],
      deletedBy: [],
      isAdmin: false,
      toIds: [orders?.driver?.id, orders?.vendor?.id],
      notificationType: 1,
      title: `Rescheduled Order`,
      adminMessage: convertAdminMessage(
        orders?.order?.user?.fullName,
        orders?.scheduleDate,
        orders?.order?.timeSlot?.startTime,
        orders?.order?.timeSlot?.endTime,
      ),
      description:
        user?.userType === PropaneUserType.VENDOR
          ? `${orders?.order?.user?.fullName} order is rescheduled by vendor on this ${orders?.scheduleDate} & ${orders?.order?.timeSlot?.startTime} to ${orders?.order?.timeSlot?.endTime}`
          : convertAdminMessage(
              orders?.order?.user?.fullName,
              orders?.scheduleDate,
              orders?.order?.timeSlot?.startTime,
              orders?.order?.timeSlot?.endTime,
            ),
    });
    await notificationRepo.save(notificationToUser);

    try {
      await notificationService.execute({
        title: 'Rescheduled Order',
        description:
          user?.userType === PropaneUserType.VENDOR
            ? `${orders?.order?.user?.fullName} order is rescheduled by vendor on this ${orders?.scheduleDate} & ${orders?.order?.timeSlot?.startTime} to ${orders?.order?.timeSlot?.endTime}`
            : convertAdminMessage(
                orders?.order?.user?.fullName,
                orders?.scheduleDate,
                orders?.order?.timeSlot?.startTime,
                orders?.order?.timeSlot?.endTime,
              ),
        notificationType: 1,
        tokens: compact([orders?.driver?.token?.deviceId, orders?.vendor?.token?.deviceId]),
      });
    } catch (error) {
      logger.error('Error while send notification');
    }
  }

  // TODO: user send notification
  if (orders && orders?.order?.user?.token) {
    const notificationRepo = getCustomRepository(NotificationsRepository);

    const notificationToUser = notificationRepo.create({
      readedBy: [],
      deletedBy: [],
      isAdmin: false,
      toIds: [orders?.order?.user?.id],
      notificationType: 1,
      title: `Rescheduled Order`,
      adminMessage: convertAdminMessage(
        orders?.order?.user?.fullName,
        orders?.scheduleDate,
        orders?.order?.timeSlot?.startTime,
        orders?.order?.timeSlot?.endTime,
      ),
      description:
        user.userType === PropaneUserType.VENDOR
          ? convertVendorMessage(
              orders?.vendor?.vendor?.businessName,
              orders?.scheduleDate,
              orders?.order?.timeSlot?.startTime,
              orders?.order?.timeSlot?.endTime,
            )
          : convertUserMessage(
              orders?.scheduleDate,
              orders?.order?.timeSlot?.startTime,
              orders?.order?.timeSlot?.endTime,
            ),
    });
    await notificationRepo.save(notificationToUser);

    try {
      await notificationService.execute({
        title: 'Rescheduled Order',
        description:
          user.userType === PropaneUserType.VENDOR
            ? convertVendorMessage(
                orders?.vendor?.vendor?.businessName,
                orders?.scheduleDate,
                orders?.order?.timeSlot?.startTime,
                orders?.order?.timeSlot?.endTime,
              )
            : convertUserMessage(
                orders?.scheduleDate,
                orders?.order?.timeSlot?.startTime,
                orders?.order?.timeSlot?.endTime,
              ),
        notificationType: 1,
        tokens: compact([orders?.order?.user?.token?.deviceId]),
      });
    } catch (error) {
      logger.error('Error while send notification');
    }
  }

  res.sendStatus(200);
};

const convertVendorMessage = (
  businessName: string | null | undefined,
  scheduleDate: Date | string | null | undefined,
  startTime: Date | string | null | undefined,
  endTime: Date | string | null | undefined,
) => {
  return `Your order is rescheduled by vendor ${businessName || '-'} on this ${
    scheduleDate || '-'
  } & ${startTime || '-'} to ${endTime || '-'}`;
};

const convertUserMessage = (
  scheduleDate: Date | string | null | undefined,
  startTime: Date | string | null | undefined,
  endTime: Date | string | null | undefined,
) => {
  return `Your order is rescheduled by admin on this ${scheduleDate || '-'} & ${
    startTime || '-'
  } to ${endTime || '-'}`;
};

const convertAdminMessage = (
  fullName: string | null | undefined,
  scheduleDate: Date | string | null | undefined,
  startTime: Date | string | null | undefined,
  endTime: Date | string | null | undefined,
) => {
  return `${fullName} order is rescheduled by admin on this ${scheduleDate || '-'} & ${
    startTime || '-'
  } to ${endTime || '-'}`;
};
