import { Between, getManager, getRepository, MoreThanOrEqual } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import _ from 'lodash';
import moment from 'moment';
import * as momentTimeZone from 'moment-timezone';

import { Users } from '../model/Users';
import { DriverStocks } from '../model/DriverStocks';
import { DriverDetails } from '../model/DriverDetails';
import { VendorDetails } from '../model/VendorDetails';
import { NotFoundError } from '../error';
import { LowStockReminder } from '../service/lowStockReminder';
import { VendorStocks } from '../model/VendorStocks';

export const getAllDriverValidation = {
  query: Joi.object({
    driverType: Joi.number().required(),
  }),
};

export const getAllDriver = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    query: { driverType },
  } = req;

  const query = getManager()
    .createQueryBuilder(DriverDetails, 'drivers')
    .select(['drivers.id', 'drivers.vehicalNo'])
    .leftJoin('drivers.user', 'user')
    .addSelect([
      'user.id',
      'user.fullName',
      'user.isActive',
      'user.mobileNumber',
      'user.profileImage',
    ]);

  // vendorDriver
  if (Number(driverType) === 1) {
    query.leftJoin('drivers.vendor', 'vendor').where('vendor.user = :userId', { userId });
  }

  const getZipcode = getManager()
    .createQueryBuilder(VendorDetails, 'vendor')
    .select(['vendor.zipcodeIds'])
    .where('vendor.user = :userId', { userId });

  const zipcode = await getZipcode.getOne();

  // freelance
  if (Number(driverType) === 2) {
    query
      .andWhere('drivers.vendor IS  NULL')
      .andWhere('drivers.zipcodeIds IN (:zipcodeIds)', { zipcodeIds: zipcode?.zipcodeIds });
  }

  const [drivers, count] = await query.getManyAndCount();
  res.status(200).json({ drivers, count });
};

export const driverDetailsValidation = {
  query: Joi.object({
    userId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
export const driverDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { userId },
  } = req;
  const startAt = moment().startOf('day').toDate();
  const endAt = moment().endOf('day').toDate();

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select(['user.id', 'user.fullName', 'user.mobileNumber', 'user.profileImage'])
    .where('user.id = :userId', { userId });

  const details = await query.getOne();
  const stock = getManager()
    .createQueryBuilder(DriverDetails, 'DriverDetails')
    .select(['DriverDetails.id', 'DriverDetails.vehicalNo'])
    .where('DriverDetails.user = :userId', { userId })
    .leftJoin('DriverDetails.driverStocks', 'stocks')
    .addSelect(['stocks.id', 'stocks.category', 'stocks.addedFilled'])
    .groupBy('stocks.product')
    .addGroupBy('stocks.category')
    .addGroupBy('stocks.accessory')
    .andWhere('stocks.addedAt BETWEEN :startAt AND :endAt', { startAt, endAt })
    .leftJoin('stocks.product', 'product')
    .addSelect(['product.id', 'product.name', 'product.logo'])
    .addSelect('SUM(stocks.addedFilled) "sumAddedFilled"')
    .addSelect([
      'SUM(stocks.returnedEmpty) "returnedEmpty"',
      'SUM(stocks.returnedFilled) "returnedFilled"',
    ])
    .leftJoin('stocks.accessory', 'accessory')
    .addSelect(['accessory.name', 'accessory.price', 'accessory.image']);

  const stocks = await stock.getRawMany();
  res.status(200).json({ details, stocks });
};

export const returnAddStockValidation = {
  body: Joi.object({
    operation: Joi.number().required(),
    categoryId: Joi.number().required(),
    productId: Joi.number().optional(),
    cylinderSizeId: Joi.number().optional(),
    accessoriesId: Joi.number().optional(),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    filled: Joi.number().optional(),
    empty: Joi.number().optional(),
    addStock: Joi.number().optional(),
    addedAtDate: Joi.date().optional(),
  }),
};

export const returnAddStock = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: {
      operation,
      categoryId,
      productId,
      cylinderSizeId,
      driverId,
      filled,
      empty,
      addStock,
      addedAtDate,
      accessoriesId,
    },
  } = req;

  const startAt = moment(addedAtDate).startOf('day').toDate();
  const endAt = moment(addedAtDate).endOf('day').toDate();

  const driverStockRepo = getRepository(DriverStocks);
  new LowStockReminder().execute({
    userId: user?.id,
  });
  const vendorStocksRepo = getRepository(VendorStocks);

  let existPreviousStock;
  let existPreviousStockVendor;
  let existPreviousStockVendorReturn;

  if (categoryId === 1 || categoryId === 2) {
    existPreviousStock = await driverStockRepo.findOne({
      where: {
        driver: await getManager()
          .getRepository(DriverDetails)
          .findOne({ where: { user: driverId } }),
        category: categoryId,
        product: productId,
        cylinderSize: cylinderSizeId,
        addedAt: Between(startAt, endAt),
      },
    });
    existPreviousStockVendor = await vendorStocksRepo.findOne({
      where: {
        vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
        category: categoryId,
        product: productId,
        cylinderSize: cylinderSizeId,
        remainingStock: MoreThanOrEqual(addStock),
      },
    });
    existPreviousStockVendorReturn = await vendorStocksRepo.findOne({
      where: {
        vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
        category: categoryId,
        product: productId,
        cylinderSize: cylinderSizeId,
      },
    });
  } else {
    existPreviousStock = await driverStockRepo.findOne({
      where: {
        driver: await getManager()
          .getRepository(DriverDetails)
          .findOne({ where: { user: driverId } }),
        category: categoryId,
        accessory: accessoriesId,
        addedAt: Between(startAt, endAt),
      },
    });
    existPreviousStockVendor = await vendorStocksRepo.findOne({
      where: {
        vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
        category: categoryId,
        accessory: accessoriesId,
        remainingStock: MoreThanOrEqual(addStock),
      },
    });
    existPreviousStockVendorReturn = await vendorStocksRepo.findOne({
      where: {
        vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
        category: categoryId,
        accessory: accessoriesId,
      },
    });
  }

  if (operation && operation === 1) {
    if (!existPreviousStock && existPreviousStockVendor) {
      const driverStocks = driverStockRepo.create({
        category: categoryId,
        product: productId,
        cylinderSize: cylinderSizeId,
        addedAt: addedAtDate,
        addedFilled: addStock,
        accessory: accessoriesId,
        driver: await getManager()
          .getRepository(DriverDetails)
          .findOne({ where: { user: driverId } }),
      });
      await driverStockRepo.save(driverStocks);

      // /implementing for vendor
      if (existPreviousStockVendor) {
        await vendorStocksRepo.save(
          Object.assign({}, existPreviousStockVendor, {
            category: categoryId,
            product: productId,
            accessory: accessoriesId,
            cylinderSize: cylinderSizeId,
            remainingStock: existPreviousStockVendor.remainingStock - addStock,
            vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
          }),
        );
      }
    } else {
      if (existPreviousStockVendor) {
        // TODO: when vendor want update the stock then this logic execute
        await driverStockRepo.save(
          Object.assign({}, existPreviousStock, {
            category: categoryId,
            product: productId,
            accessory: accessoriesId,
            cylinderSize: cylinderSizeId,
            addedFilled: existPreviousStock.addedFilled + addStock,
            driver: await getManager()
              .getRepository(DriverDetails)
              .findOne({ where: { user: driverId } }),
          }),
        );
        if (existPreviousStockVendor) {
          await vendorStocksRepo.save(
            Object.assign({}, existPreviousStockVendor, {
              category: categoryId,
              product: productId,
              accessory: accessoriesId,
              cylinderSize: cylinderSizeId,
              remainingStock: existPreviousStockVendor.remainingStock - addStock,
              vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
            }),
          );
        }
      } else {
        throw new NotFoundError('You dont have sufficient stock', 'NOT_FOUND');
      }
    }
  }
  // TODO: when vendor want Return the stock then this logic execute
  if (operation && operation === 2) {
    if (categoryId === 3) {
      if (
        driverStockRepo.findOne({
          where: {
            accessory: accessoriesId,
          },
        })
      ) {
        await driverStockRepo.save(
          Object.assign({}, existPreviousStock, {
            category: categoryId,
            accessory: accessoriesId,
            addedFilled: existPreviousStock.addedFilled - filled,
            returnedFilled: filled,
            returnedEmpty: empty,
            driver: await getManager()
              .getRepository(DriverDetails)
              .findOne({ where: { user: driverId } }),
          }),
        );
        if (existPreviousStockVendorReturn) {
          await vendorStocksRepo.save(
            Object.assign({}, existPreviousStockVendorReturn, {
              category: categoryId,
              accessory: accessoriesId,
              remainingStock: existPreviousStockVendorReturn.remainingStock + filled,
              returnedFilled: filled,
              returnedEmpty: empty,
              addedFilled: filled,
              vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
            }),
          );
        }
      } else {
        throw new NotFoundError('No such accesssories  found in your stock', 'NOT_FOUND');
      }
    } else {
      if (existPreviousStock) {
        await driverStockRepo.save(
          Object.assign({}, existPreviousStock, {
            category: categoryId,
            product: productId,
            addedFilled: existPreviousStock.addedFilled - filled,
            cylinderSize: cylinderSizeId,
            returnedFilled: filled,
            returnedEmpty: empty,
            driver: await getManager()
              .getRepository(DriverDetails)
              .findOne({ where: { user: driverId } }),
          }),
        );
        if (existPreviousStockVendorReturn) {
          await vendorStocksRepo.save(
            Object.assign({}, existPreviousStockVendorReturn, {
              category: categoryId,
              product: productId,
              cylinderSize: cylinderSizeId,
              remainingStock: existPreviousStockVendorReturn.remainingStock + filled,
              returnedFilled: filled,
              returnedEmpty: empty,
              vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
            }),
          );
        }
      } else {
        throw new NotFoundError(' No such product  found in your stock', 'NOT_FOUND');
      }
    }
  }

  res.sendStatus(201);
};

export const getDriverStocksValidation = {
  query: Joi.object({
    ProductId: Joi.number().integer().required(),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
  }),
};

export const allStockList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    query: { ProductId, startAt, endAt },
  } = req;

  const query = getManager()
    .createQueryBuilder(DriverStocks, 'drivers')
    .select([
      'drivers.id',
      'drivers.createdAt',
      'DATE_FORMAT(drivers.created_at, "%Y/%m/%d") AS drivers_created_date',
    ])
    .where('drivers.product = :ProductId', { ProductId })
    .leftJoin('drivers.driver', 'driverDetails')
    .where('driverDetails.user = :userId', { userId })
    .leftJoin('drivers.cylinderSize', 'cylindersize')
    .addSelect(['cylindersize.cylinderSize'])
    .addSelect('SUM(drivers.addedFilled) "sumAddedFilled"')
    .addSelect('SUM(drivers.addedEmpty) "sumAddedEmpty"')
    .groupBy('cylindersize.id')
    .addGroupBy('drivers_created_date')
    .orderBy('drivers.createdAt', 'DESC');

  if (startAt && endAt) {
    query.andWhere('drivers.createdAt BETWEEN :startAt AND :endAt', {
      startAt,
      endAt,
    });
  }

  // TODO:user remove for features
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stocks: any = await query.getRawMany();
  stocks = _.groupBy(stocks, 'drivers_created_date');
  stocks = Object.keys(stocks).map((key) => {
    return {
      date: key,
      data: stocks[key],
    };
  });
  res.status(200).json({ stocks });
};

export const driverUpdateStockList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: driverId },
  } = req;
  const startAt = momentTimeZone.tz('America/New_York').startOf('day').toDate();
  const endAt = momentTimeZone.tz('America/New_York').endOf('day').toDate();

  const driverStock = await getManager()
    .createQueryBuilder(DriverStocks, 'driverStock')
    .select(['driverStock.id', 'driverStock.addedFilled', 'driverStock.addedEmpty'])
    .andWhere('driverStock.addedAt BETWEEN :startAt AND :endAt', { startAt, endAt })
    .leftJoin('driverStock.driver', 'driver')
    .andWhere('driver.user =:driverId', { driverId })
    .leftJoin('driverStock.cylinderSize', 'cylindersize')
    .addSelect(['cylindersize.cylinderSize'])
    .leftJoin('driverStock.accessory', 'accessory')
    .addSelect(['accessory.id', 'accessory.name', 'accessory.image', 'accessory.price'])
    .leftJoin('driverStock.product', 'product')
    .addSelect(['product.id', 'product.name', 'product.logo'])
    .getRawMany();

  res.status(200).json({ driverStock });
};
