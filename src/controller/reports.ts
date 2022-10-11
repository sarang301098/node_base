import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { Brackets, getManager } from 'typeorm';

import { OrderDetails } from '../model/OrderDetails';
import { Products } from '../model/Products';
import { Users } from '../model/Users';
import { VendorStocks } from '../model/VendorStocks';
import { PropaneUserType } from '../constants';
import { MailReportService } from '.././service/repotEmail';
import { createPdf } from '../utils/createPdf';
import { MailBody } from '../service/Mail';

export const getCustomerReportValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    status: Joi.number().integer().optional(),
    isActive: Joi.number().optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('fullName'),
  }),
};
export const customersReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { status, search, page, perPage, startAt, endAt, isActive, sort, sortBy },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;
  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select([
      'user.id',
      'user.email',
      'user.userType',
      'user.isActive',
      'user.fullName',
      'user.createdAt',
      'user.countryCode',
      'user.mobileNumber',
      'user.userSubscriptionCount',
    ])
    .leftJoin('user.orders', 'orders')
    .addSelect(['sum(orders.grandTotal ) "TotalAmountPaid"', 'count(orders.user ) "TotalOrders"'])
    .groupBy('user.id')
    .where('user.userType = :userType', { userType: PropaneUserType.USER })
    .offset(offset)
    .limit(limit);

  if (startAt && endAt) {
    query.andWhere('user.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (sort && sortBy) {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC' | undefined);
  }

  if (status) {
    if (Number(status) === 1) {
      query.andWhere(
        new Brackets((qb) => {
          return qb
            .orWhere('user.userSubscriptionCount = 0')
            .orWhere('user.userSubscriptionCount IS NULL');
        }),
      );
    }
    if (Number(status) === 2) {
      query.andWhere('user.userSubscriptionCount > 0');
    }
  }

  if (isActive !== undefined) {
    query.andWhere('user.isActive = :isActive', { isActive });
  }

  const customers = await query.getRawMany();
  const count = await query.getCount();

  res.status(200).json({ customers, count });
};

export const getDriverReportValidation = {
  query: Joi.object({
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    freelanceDriverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    startAt: Joi.date().optional(),
    driverType: Joi.string().max(50).optional().valid('driver', 'freelance'),
    endAt: Joi.date().optional(),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isActive: Joi.number().optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().valid('driver', 'vendor').default('driver'),
  }),
};
export const driverReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: {
      driverId,
      search,
      page,
      perPage,
      startAt,
      endAt,
      isActive,
      sort,
      sortBy,
      driverType,
      freelanceDriverId,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;
  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select([
      'user.id',
      'user.email',
      'user.userType',
      'user.isActive',
      'user.fullName',
      'user.createdAt',
      'user.countryCode',
      'user.mobileNumber',
    ])
    .where('user.userType = :userType', { userType: PropaneUserType.DRIVER })
    .leftJoin('user.driver', 'drivers')
    .addSelect(['drivers.isOnline', 'drivers.vendor'])
    .leftJoin('user.driverOrders', 'driverOrders')
    .addSelect([
      'count(driverOrders.driver ) "TotalOrders"',
      'sum(driverOrders.freelanceDriverReceivedAmount ) "totalAmount"',
    ])
    .groupBy('user.id')
    .leftJoin('drivers.vendor', 'vendors')
    .addSelect(['vendors.businessName'])
    .leftJoin('vendors.user', 'users')
    .addSelect(['users.fullName'])
    .offset(offset)
    .limit(limit);

  if (startAt && endAt) {
    query.andWhere('user.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (sort && sortBy === 'driver') {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC' | undefined);
  }

  if (sort && sortBy === 'vendor') {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC' | undefined);
  }

  if (isActive !== undefined) {
    query.andWhere('user.isActive = :isActive', { isActive: isActive });
  }

  if (driverType && driverType === 'driver') {
    query.andWhere('drivers.vendor_Id IS NOT NULL');
  }
  if (driverType && driverType === 'freelance') {
    query.andWhere('drivers.vendor_Id IS NULL');
  }

  if (freelanceDriverId || driverId) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('user.id = :freelanceDriverId', { freelanceDriverId })
          .orWhere('user.id = :driverId', { driverId });
      }),
    );
  }

  const drivers = await query.getRawMany();
  const count = await query.getCount();

  res.status(200).json({ drivers, count });
};

export const getVendorReportValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    active: Joi.string().optional(),
    isActive: Joi.number().optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('fullName'),
  }),
};
export const vendorReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, startAt, endAt, isActive, sort, sortBy },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;
  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select([
      'user.id',
      'user.email',
      'user.userType',
      'user.isActive',
      'user.fullName',
      'user.createdAt',
      'user.countryCode',
      'user.mobileNumber',
    ])
    .where('user.userType = :userType', { userType: PropaneUserType.VENDOR })
    .leftJoin('user.vendorOrders', 'orderdetails')
    .addSelect([
      'orderdetails.status',
      'sum(orderdetails.grandTotal) "TotalAmountPaidOnline"',
      'sum(orderdetails.grandTotal) "TotalEarning"',
      'sum(orderdetails.vendorReceivedAmount) "VendorNetEarning"',
      'sum(orderdetails.vendorReceivedAmount) "TotalAmountDueToAdmin"',
      'sum(orderdetails.adminReceivedAmount) "AdminNetEarning"',
      'sum(orderdetails.freelanceDriverReceivedAmount) "totalAmountPaidToFreelanceDriver"',
    ])
    .groupBy('user.id')
    .leftJoin('user.orderLogs', 'orderLogs')
    .addSelect([
      'sum(orderLogs.status = "delivered" ) "DeliveredOrders"',
      'sum(orderLogs.status = "rescheduled" ) "RescheduleOrders"',
      'sum(orderLogs.status = "cancelled" ) "PassesOrders"',
    ])
    .offset(offset)
    .limit(limit);

  if (startAt && endAt) {
    query.andWhere('user.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (sort && sortBy) {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC' | undefined);
  }

  if (isActive !== undefined) {
    query.andWhere('user.isActive = :isActive', { isActive });
  }

  const vendor = await query.getRawMany();
  const count = await query.getCount();

  res.status(200).json({ vendor, count });
};

export const getProductReportValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    productId: Joi.number().optional(),
    cylinderSizeId: Joi.number().optional(),
    orderType: Joi.number().optional(),
  }),
};
export const productReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, startAt, endAt, orderType, productId, cylinderSizeId },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Products, 'products')
    .select(['products.id', 'products.name'])
    .leftJoin('products.orders', 'orderdetails')
    .addSelect([
      'orderdetails.orderType',
      'count(orderdetails.id ) "TotalOrder"',
      'sum(orderdetails.grandTotal ) "TotalSales"',
    ])
    .leftJoin('orderdetails.cylinderSize', 'cylinderSizes')
    .addSelect(['cylinderSizes.cylinderSize'])
    .groupBy('cylinderSizes.id')
    .addGroupBy('orderdetails.orderType')
    .addGroupBy('orderdetails.product');

  if (startAt && endAt) {
    query.andWhere('products.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('products.name like :name', { name: '%' + search + '%' });
  }

  if (orderType !== undefined) {
    query.andWhere('orderdetails.orderType = :orderType', { orderType });
  }

  if (productId !== undefined) {
    query.andWhere('orderdetails.product = :productId', { productId });
  }

  if (cylinderSizeId !== undefined) {
    query.andWhere('cylinderSizes.id = :cylinderSizeId', { cylinderSizeId });
  }

  // Anup's changes
  let productReports = await query.getRawMany();
  const count = productReports.length;

  query.offset(offset);
  query.limit(limit);

  productReports = await query.getRawMany();

  res.status(200).json({ productReports, count });
};

export const getInventoryReportValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().valid('user', 'product', 'category', 'accessory').default('user'),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    productId: Joi.number().optional(),
    categoryId: Joi.number().optional(),
    accessoryId: Joi.number().optional(),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).optional(),
    cylinderSizeId: Joi.number().optional(),
  }),
};
export const invertoryStockReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: {
      search,
      page,
      perPage,
      startAt,
      endAt,
      productId,
      cylinderSizeId,
      vendorId,
      categoryId,
      accessoryId,
      sort,
      sortBy,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(VendorStocks, 'Stock')
    .select([
      'Stock.addedAt',
      'Stock.addedStockQty',
      'Stock.remainingStock',
      'Stock.openingStock',
      'Stock.soldOutStock',
      'Stock.category',
    ])
    .leftJoin('Stock.category', 'category')
    .addSelect(['category.name'])
    .leftJoin('Stock.product', 'product')
    .addSelect(['product.name'])
    .leftJoin('Stock.accessory', 'accessory')
    .addSelect(['accessory.name'])
    .leftJoin('Stock.cylinderSize', 'cylinderSizes')
    .addSelect(['cylinderSizes.cylinderSize'])
    .leftJoin('Stock.vendor', 'vendor')
    .addSelect(['vendor.businessName'])
    .leftJoin('vendor.user', 'user')
    .addSelect(['user.fullName', 'user.id'])
    .offset(offset)
    .limit(limit);

  if (startAt && endAt) {
    query.andWhere('Stock.addedAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (vendorId !== undefined) {
    query.andWhere('user.id = :vendorId', { vendorId });
  }

  if (cylinderSizeId !== undefined) {
    query.andWhere('Stock.cylinderSize = :cylinderSizeId', { cylinderSizeId });
  }

  if (categoryId !== undefined) {
    query.andWhere('Stock.category = :categoryId', { categoryId });
  }

  if (productId !== undefined) {
    query.andWhere('Stock.product = :productId', { productId });
  }

  if (accessoryId !== undefined) {
    query.andWhere('Stock.accessory = :accessoryId', { accessoryId });
  }

  if (sort && sortBy === 'user') {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC' | undefined);
  }

  if (sort && sortBy === 'product') {
    query.orderBy('product.name', sort as 'ASC' | 'DESC' | undefined);
  }

  if (sort && sortBy === 'category') {
    query.orderBy('category.name', sort as 'ASC' | 'DESC' | undefined);
  }

  if (sort && sortBy === 'accessory') {
    query.orderBy('accessory.name', sort as 'ASC' | 'DESC' | undefined);
  }

  const [inventoryReports, count] = await query.getManyAndCount();

  res.status(200).json({ inventoryReports, count });
};

export const getOrdersReportValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().valid('customer', 'vendor', 'driver').default('customer'),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    productId: Joi.number().optional(),
    categoryId: Joi.number().optional(),
    orderType: Joi.number().optional(),
    paymentStatus: Joi.number().optional(),
    status: Joi.string().optional(),
    vendorId: Joi.number().optional(),
  }),
};
export const ordersReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: {
      page,
      perPage,
      startAt,
      endAt,
      sort,
      sortBy,
      orderType,
      status,
      paymentStatus,
      search,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;
  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetails')
    .select([
      'orderDetails.id',
      'orderDetails.status',
      'orderDetails.adminReceivedAmount',
      'orderDetails.grandTotal',
      'orderDetails.orderType',
      'orderDetails.createdAt',
      'orderDetails.scheduleDate',
    ])
    .leftJoin('orderDetails.vendor', 'vendor')
    .addSelect(['vendor.fullName', 'vendor.id'])
    .leftJoin('orderDetails.driver', 'driver')
    .addSelect(['driver.fullName', 'driver.id'])
    .leftJoin('driver.driver', 'driverDetails')
    .leftJoin('orderDetails.order', 'order')
    .addSelect(['driverDetails.vendor_id IS NOT NULL as vendorsDriver'])
    .addSelect(['order.id', 'order.isPaid'])
    .leftJoin('order.user', 'user')
    .addSelect(['user.fullName', 'user.id'])
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

  if (startAt && endAt) {
    query.andWhere('order.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  if (orderType !== undefined) {
    query.andWhere('orderDetails.orderType = :orderType', { orderType });
  }

  if (status !== undefined) {
    query.andWhere('orderDetails.status = :status', { status });
  }

  if (paymentStatus !== undefined) {
    query.andWhere('order.isPaid = :paymentStatus', { paymentStatus });
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

  const ordersReports = await query.getRawMany();
  const count = await query.getCount();
  res.status(200).json({ ordersReports, count });
};

export const getTranscationReportValidation = {
  query: Joi.object({
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().valid('driver', 'vendor', 'customer').default('customer'),
    search: Joi.string().max(50).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(50),
    orderType: Joi.number().optional(),
    paymentStatus: Joi.number().optional(),
  }),
};
export const getTranscationReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { page, perPage, startAt, endAt, sort, sortBy, orderType, paymentStatus, search },
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
      'orderDetails.scheduleDate',
      'orderDetails.orderType',
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
    .innerJoin('orderDetails.order', 'order')
    .addSelect(['order.id', 'order.isPaid'])
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
          .orWhere('orderDetails.created_at BETWEEN :startAt AND :endAt', {
            startAt,
            endAt,
          });
      }),
    );
  }

  if (orderType && orderType !== null) {
    query.andWhere('orderDetails.orderType = :orderType', { orderType });
  }
  if (paymentStatus !== undefined) {
    query.andWhere('order.isPaid = :paymentStatus', { paymentStatus });
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

  const [transactions, count] = await query.getManyAndCount();
  res.status(200).json({ transactions, count });
};

export const getGenerateReportValidation = {
  query: Joi.object({
    driverIds: Joi.alternatives(
      Joi.array().items(Joi.alternatives(Joi.string().uuid({ version: 'uuidv4' }).required())),
    ),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    status: Joi.string().optional(),
    Report: Joi.string().optional(),
  }),
};
export const generateReport = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { driverIds, startAt, endAt, status, Report },
  } = req;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetails')
    .andWhere(
      'orderDetails.status = :status AND orderDetails.driver_id IN (:...driverIds) AND orderDetails.vendor_id = :userId AND orderDetails.schedule_date >= :startAt AND orderDetails.schedule_date <= :endAt',
      {
        startAt,
        endAt,
        userId: user.id,
        driverIds: driverIds,
        status: status,
      },
    )
    .leftJoinAndSelect('orderDetails.driver', 'driver');

  const drivers = await query.getRawMany();

  if (drivers.length > 0) {
    const pdfPath = await createPdf(
      'report.ejs',
      { drivers: drivers, report: Report },
      new Date().toISOString() + '.pdf',
    );

    const mailreportService = new MailReportService();
    const mailBody = {
      to: user.email,
      text: 'pdf doument',
      attachments: [
        {
          filename: 'driverReport.pdf',
          path: pdfPath.filePath,
          contentType: 'application/pdf',
        },
      ],
      subject: 'Drivers Report',
    };

    mailreportService.send(mailBody as MailBody);

    // fs.unlinkSync(pdfPath.filePath);

    res.status(200).send({ message: 'report send to vendor.' });
  } else {
    res.status(200).send({ message: 'records not found.' });
  }
};
