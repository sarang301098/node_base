import { Brackets, getManager } from 'typeorm';
import { Joi } from 'express-validation';
import { Request, Response } from 'express';
import { filter, sumBy, find } from 'lodash';
import moment from 'moment';

import { Users } from '../model/Users';
import { Orders } from '../model/Orders';
import { OrderDetails } from '../model/OrderDetails';
import { VendorDetails } from '../model/VendorDetails';

import { PropaneUserType, OrderStatus } from '../constants';
import { DriverDetails } from '../model/DriverDetails';

export const getVendorDashboard = () => async (req: Request, res: Response): Promise<void> => {
  const { user } = req;
  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderdetail')
    .select([
      'SUM(orderdetail.status = "Delivered" ) "totalSales"',
      'SUM(orderdetail.vendorReceivedAmount ) "totalEarnings"',
      'COUNT(orderdetail.id ) "manageOrders"',
      'SUM(orderdetail.status = "ongoing" ) "ongoingOrder"',
      'AVG(orderdetail.vendorReceivedAmount / orderdetail.grandTotal )*100 "totalEarningPercentage"',
    ])
    .where('orderdetail.vendor_id = :vendorId', { vendorId: user?.id });

  const dashboard = await query.getRawOne();
  const totalSalesPercentages =
    ((dashboard?.totalSales || 0) / (dashboard?.manageOrders || 0)) * 100;
  const totalSalesPercentage = Math.ceil(totalSalesPercentages);

  const start = moment().toDate();
  const vendor = getManager()
    .createQueryBuilder(VendorDetails, 'vendordetails')
    .select(['vendordetails.businessName'])
    .leftJoin('vendordetails.vendorStocks', 'vendorStocks')
    .addSelect([
      'vendorStocks.addedStockQty',
      'vendorStocks.remainingStock',
      'vendorStocks.openingStock',
    ])
    .orderBy('vendorStocks.addedAt', 'DESC')
    .leftJoin('vendordetails.drivers', 'DriverDetails')
    .leftJoin('DriverDetails.driverStocks', 'driverStocks')
    .addSelect(['driverStocks.addedFilled'])
    .addSelect(['SUM(driverStocks.addedFilled  ) "addedFilled"'])
    .andWhere('driverStocks.createdAt <= :start', { start })
    .where('vendordetails.user_id = :userId', { userId: user?.id });
  const dashboardVendor = await vendor.getRawOne();
  const assignedFreelanceStock =
    (dashboardVendor?.vendorStocks_opening_stock || 0) - (dashboardVendor?.addedFilled || 0);

  res
    .status(200)
    .json({ dashboard, dashboardVendor, assignedFreelanceStock, totalSalesPercentage });
};

export const getAdminDashboard = () => async (req: Request, res: Response): Promise<void> => {
  // users and Vendors Count
  let vendorsCount = 0;
  let customersCount = 0;
  const userAndVendorsCount = await getManager()
    .createQueryBuilder(Users, 'users')
    .where('users.userType IN (:...userType)', {
      userType: [PropaneUserType.USER, PropaneUserType.VENDOR],
    })
    .select('users.userType AS user_type')
    .addSelect('COUNT(*) AS count')
    .groupBy('users.userType')
    .getRawMany();

  if (userAndVendorsCount && userAndVendorsCount.length) {
    vendorsCount = Number(
      (find(userAndVendorsCount, ['user_type', PropaneUserType.VENDOR]) || {}).count,
    );
    customersCount = Number(
      (find(userAndVendorsCount, ['user_type', PropaneUserType.USER]) || {}).count,
    );
  }

  // drivers
  let vendorsDriver = 0;
  let freelanceDriver = 0;
  const driversCount = await getManager()
    .createQueryBuilder(Users, 'users')
    .where('users.userType IN (:...userType)', {
      userType: [PropaneUserType.DRIVER],
    })
    .leftJoin('users.driver', 'driver')
    .select('IF(driver.vendor_id IS NOT NULL, true, false) AS isVendorsDriver')
    .addSelect('COUNT(*) AS count')
    .groupBy('isVendorsDriver')
    .getRawMany();

  if (driversCount && driversCount.length) {
    vendorsDriver = Number((find(driversCount, ['isVendorsDriver', 1]) || {}).count);
    freelanceDriver = Number((find(driversCount, ['isVendorsDriver', 0]) || {}).count);
  }

  // orders statistics
  const start = moment().startOf('day').toDate();
  const end = moment().endOf('day').toDate();

  const todaysOrders = await getManager()
    .createQueryBuilder(OrderDetails, 'OrderDetails')
    .where('OrderDetails.scheduleDate BETWEEN :start AND :end', {
      start,
      end,
    })
    .getCount();

  // total delivered and cancelled Orders.
  const ordersCount = await getManager()
    .createQueryBuilder(OrderDetails, 'OrderDetails')
    .where('OrderDetails.status IN (:...status)', {
      status: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.CANCELLED_BY_ADMIN],
    })
    .select('OrderDetails.status AS order_status')
    .addSelect('COUNT(*) AS count')
    .groupBy('order_status')
    .getRawMany();

  let cancelledOrders = 0;
  let deliveredOrders = 0;
  if (ordersCount && ordersCount.length) {
    cancelledOrders = sumBy(
      filter(
        (ordersCount || []).map((cnt) => {
          return { order_status: cnt.order_status, count: Number(cnt.count) };
        }),
        (o) => {
          return (
            o.order_status === OrderStatus.CANCELLED ||
            o.order_status === OrderStatus.CANCELLED_BY_ADMIN
          );
        },
      ),
      'count',
    );

    deliveredOrders = sumBy(
      filter(
        (ordersCount || []).map((cnt) => {
          return { order_status: cnt.order_status, count: Number(cnt.count) };
        }),
        (o) => {
          return o.order_status === OrderStatus.DELIVERED;
        },
      ),
      'count',
    );
  }

  const paidOrders = await getManager()
    .createQueryBuilder(Orders, 'orders')
    .where('orders.isPaid = :isPaid', {
      isPaid: true,
    })
    .select(['orders.id', 'orders.grandTotal'])
    .getMany();

  const totalRevenue = sumBy(paidOrders, 'grandTotal');

  res.status(200).json({
    vendorsCount,
    customersCount,
    vendorsDriver,
    freelanceDriver,
    deliveredOrders,
    cancelledOrders,
    todaysOrders,
    totalRevenue,
  });
};

export const getAdminDashboardOrdersValidation = {
  query: Joi.object({
    startAt: Joi.date().optional().allow(null),
    endAt: Joi.date().optional().allow(null),
    status: Joi.alternatives(
      Joi.array()
        .items(Joi.alternatives(Joi.number().integer().min(0).optional(), Joi.string().optional()))
        .optional(),
      Joi.string()
        .valid(...Object.values(OrderStatus))
        .default(null),
    ),
    sortBy: Joi.string().allow('driver', 'vendor', 'customer').default('customer'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    search: Joi.string().max(50).default(null).optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    orderType: Joi.number().integer().min(1).max(2).optional(),
    categoryId: Joi.number().integer().default(null).optional(),
    isTodayDelivered: Joi.boolean().default(true).required(),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
  }),
};
export const getAdminDashboardOrders = () => async (req: Request, res: Response): Promise<void> => {
  const {
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
      isTodayDelivered,
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
      'driverDetails.lat',
      'driverDetails.long',
    ])
    .offset(offset)
    .limit(limit);

  if (orderType && orderType !== null) {
    query.andWhere('orderDetails.orderType = :orderType', { orderType });
  }

  if (isTodayDelivered) {
    const start = moment().startOf('day').toDate();
    const end = moment().endOf('day').toDate();

    query.andWhere('orderDetails.scheduleDate BETWEEN :start AND :end', {
      start,
      end,
    });
  }

  if (driverId && driverId !== null) {
    query.andWhere('orderDetails.driver_id = :driverId', { driverId });
  }

  if (vendorId) {
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

  if (status && Array.isArray(status)) {
    query.andWhere('orderDetails.status IN (:...status)', { status });
  }

  if (status && status !== null) {
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
        timeSlotsId: orderDetails?.order?.timeSlotsId,
        invoicedReceiptUrl: orderDetails?.order?.invoicedReceiptUrl,
        userName: orderDetails?.order?.user?.fullName,
        vendorName: orderDetails?.vendor?.fullName,
        driverName: orderDetails?.driver?.fullName,
        categoryName: orderDetails?.category?.name,
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

export const getDriverDashborad = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: driverId },
  } = req;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderdetail')
    .select([
      'SUM(orderdetail.status="delivered")"deliveredOrder"',
      'COUNT(orderdetail.driver) "totalReceivedOrders"',
      'SUM(orderdetail.status="cancelled_by_driver")"cancelledOrder"',
    ])
    .where('orderdetail.driver=:driverId', { driverId });

  const driverDetail = await getManager()
    .createQueryBuilder(DriverDetails, 'driverDetails')
    .select(['driverDetails.isApproved', 'driverDetails.isOnline'])
    .where('driverDetails.user =:driverId', { driverId })
    .getOne();

  const driverDashboard = await query.getRawOne();

  const cancelledOrderPercentages =
    ((driverDashboard?.cancelledOrder || 0) / (driverDashboard?.totalReceivedOrders || 0)) * 100;
  delete driverDashboard.cancelledOrder;

  const start = moment().startOf('day').toDate();
  const end = moment().endOf('day').toDate();

  const upComingOrders = await getManager()
    .createQueryBuilder(OrderDetails, 'orderdetail')
    .where('orderdetail.driver=:driverId', { driverId })
    .andWhere('orderdetail.scheduleDate BETWEEN :start AND :end', {
      start,
      end,
    })
    .andWhere('orderdetail.status NOT IN (:...status)', {
      status: [
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.CANCELLED_BY_ADMIN,
        OrderStatus.CANCELLED_BY_DRIVER,
        OrderStatus.REFILLED,
      ],
    })
    .getCount();
  res
    .status(200)
    .json({ ...driverDashboard, driverDetail, cancelledOrderPercentages, upComingOrders });
};
