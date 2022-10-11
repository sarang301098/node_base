import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { Between, Brackets, getCustomRepository, getManager, getRepository } from 'typeorm';
import _ from 'lodash';
import moment from 'moment';
import { VendorStocks } from '../model/VendorStocks';
import { VendorDetails } from '../model/VendorDetails';
import { VendorProducts } from '../model/VendorProducts';
import { Accessories } from '../model/Accessory';
import { VendorProductsPricing } from '../model/VendorProductPricing';
import { VendorDetailsRepository } from '../repository/VendorDetails';
export const productListValidation = {
  query: Joi.object({
    categoryType: Joi.string().optional(),
  }),
};

export const productList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    query: { categoryType },
  } = req;
  const startAt = moment().startOf('day').toDate();
  const endAt = moment().endOf('day').toDate();

  const query = getManager()
    .createQueryBuilder(VendorStocks, 'stocks')
    .select(['stocks.id'])
    .leftJoin('stocks.vendor', 'vendorDetails')
    .where('vendorDetails.user = :userId', { userId });

  // spareTank:1 ,Exchange:2
  if (Number(categoryType) === 1 || Number(categoryType) === 2) {
    query
      .andWhere('stocks.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt })

      .leftJoin('stocks.category', 'category')
      .andWhere('stocks.category =:categoryType', { categoryType })
      .addSelect(['category.id', 'category.name'])
      .leftJoin('stocks.product', 'product')
      .leftJoin('stocks.cylinderSize', 'cylinderSize')
      .addSelect(['cylinderSize.cylinderSize'])
      .leftJoin('product.details', 'productDetails')
      .addSelect(['productDetails.indexPrice'])
      .addSelect(['product.id', 'product.name', 'product.logo'])
      .addSelect(['stocks.addedFilled', 'stocks.addedEmpty', 'stocks.addedStockQty'])
      .orderBy('stocks.id');
  }

  // Accessories:3
  if (Number(categoryType) === 3) {
    query
      .leftJoin('stocks.accessory', 'accessory')
      .addSelect([
        'accessory.id',
        'accessory.name',
        'accessory.price',
        'accessory.image',
        'accessory.description',
      ])
      .addSelect([
        'stocks.addedFilled',
        'stocks.addedEmpty',
        'stocks.returnedEmpty',
        'stocks.returnedFilled',
        'stocks.addedStockQty',
      ])
      .andWhere('stocks.category =:categoryType', { categoryType })
      .orderBy('stocks.id');
  }
  const product = await query.getRawMany();
  const count = await query.getCount();
  res.status(200).json({ product, count });
};

export const addStockValidation = {
  body: Joi.object({
    categoryId: Joi.number().optional(),
    productId: Joi.number().optional(),
    cylinderSizeId: Joi.number().optional(),
    addedAtDate: Joi.date().raw().required(),
    accessoriesId: Joi.number().optional(),
    addedStockQty: Joi.number().required(),
  }),
};

export const addStock = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { categoryId, productId, cylinderSizeId, addedAtDate, accessoriesId, addedStockQty },
  } = req;

  const vendorStocksRepo = getRepository(VendorStocks);
  const previosClosing = await getManager()
    .createQueryBuilder(VendorStocks, 'stocks')
    .leftJoin('stocks.vendor', 'vendorDetails')
    .where(
      new Brackets((qb) => {
        qb.where('vendorDetails.user = :userId AND stocks.category =:categoryId', {
          userId: user.id,
          categoryId,
        });
        if (Number(categoryId) === 1 || Number(categoryId) === 2) {
          qb.andWhere('stocks.product =:productId', { productId });
        } else {
          qb.andWhere('stocks.accessory =:accessoriesId', { accessoriesId });
        }
      }),
    )
    .andWhere('stocks.addedAt <= :addedAt', { addedAt: addedAtDate })
    .orderBy('stocks.addedAt', 'DESC')
    .getOne();

  const startAt = moment(addedAtDate).startOf('day').toDate();
  const endAt = moment(addedAtDate).endOf('day').toDate();
  let existPreviousStock;
  if (categoryId === 1 || categoryId === 2) {
    existPreviousStock = await vendorStocksRepo.findOne({
      where: {
        vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
        category: categoryId,
        product: productId,
        cylinderSize: cylinderSizeId,
        addedAt: Between(startAt, endAt),
      },
    });
  } else {
    existPreviousStock = await vendorStocksRepo.findOne({
      where: {
        vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
        category: categoryId,
        accessory: accessoriesId,
        addedAt: Between(startAt, endAt),
      },
    });
  }

  if (!existPreviousStock) {
    const vendorStock = vendorStocksRepo.create({
      category: categoryId,
      product: productId,
      cylinderSize: cylinderSizeId,
      addedAt: addedAtDate,
      addedStockQty,
      openingStock: previosClosing !== undefined ? previosClosing.remainingStock : 0,
      remainingStock:
        previosClosing !== undefined
          ? previosClosing.remainingStock + addedStockQty
          : addedStockQty,
      accessory: accessoriesId,
      vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
    });
    await vendorStocksRepo.save(vendorStock);
  } else {
    await vendorStocksRepo.update(existPreviousStock.id, {
      category: categoryId,
      product: productId,
      cylinderSize: cylinderSizeId,
      addedAt: addedAtDate,
      addedStockQty: existPreviousStock.addedStockQty + addedStockQty,
      remainingStock:
        existPreviousStock.openingStock +
        existPreviousStock.addedStockQty +
        addedStockQty -
        existPreviousStock.soldOutStock,
      accessory: accessoriesId,
      vendor: await getManager().getRepository(VendorDetails).findOne({ where: { user } }),
    });
  }

  res.sendStatus(201);
};

export const productDetailsValidation = {
  query: Joi.object({
    productId: Joi.number().required(),
    categoryId: Joi.number().optional(),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
  }),
};
export const productDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    query: { productId, startAt, endAt, categoryId },
  } = req;

  const categoryIds = categoryId;
  const query = getManager()
    .createQueryBuilder(VendorStocks, 'stocks')
    .select([
      'stocks.id',
      'stocks.createdAt',
      'DATE_FORMAT(stocks.created_at, "%Y/%m/%d") AS vendor_created_date',
    ])
    .where('stocks.product = :product', { product: productId })
    .andWhere('stocks.category = :category', { category: categoryId })
    .leftJoin('stocks.vendor', 'vendorDetails')
    .andWhere('vendorDetails.user = :userId', { userId })
    .leftJoin('stocks.cylinderSize', 'cylinderSizes')
    .addSelect(['cylinderSizes.cylinderSize'])
    .addSelect('SUM(stocks.addedFilled)', 'sumAddedFilled')
    .addSelect('SUM(stocks.addedEmpty)', 'sumAddedEmpty')
    .addSelect(['stocks.addedStockQty'])
    .leftJoin('stocks.product', 'product')
    .addSelect('product.logo')
    .leftJoin('stocks.category', 'category')
    .addSelect('category.id')
    .groupBy('cylinderSizes.id')
    .addGroupBy('vendor_created_date')
    .orderBy('stocks.createdAt', 'DESC');

  if (startAt && endAt) {
    query.andWhere('stocks.createdAt BETWEEN :startAt AND :endAt', {
      startAt,
      endAt,
    });
  }
  // TODO:user remove for features....
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stocks: any = await query.getRawMany();

  stocks = _.groupBy(stocks, 'vendor_created_date');
  stocks = Object.keys(stocks).map((key: string) => {
    return {
      date: key,
      data: stocks[key],
    };
  });

  res.status(200).json({ stocks, categoryIds });
};

export const vendorStockHistoryValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string()
      .valid('categoryName', 'accessoryName', 'productName')
      .default('categoryName'),
    search: Joi.string().max(50).default(null).optional(),
    categoryId: Joi.number().integer().optional(),
    productId: Joi.number().integer().optional(),
    accessoriesId: Joi.number().integer().optional(),
    cylinderSizeId: Joi.number().integer().optional(),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
  }),
};
export const vendorStockHistory = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: {
      vendorId,
      search,
      categoryId,
      productId,
      accessoriesId,
      cylinderSizeId,
      startAt,
      endAt,
      page,
      perPage,
      sort,
      sortBy,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(VendorStocks, 'stocks')
    .select([
      'stocks.addedAt',
      'stocks.addedStockQty',
      'stocks.remainingStock',
      'stocks.openingStock',
      'stocks.soldOutStock',
    ])
    .leftJoin('stocks.vendor', 'vendorDetails')
    .where('vendorDetails.user = :vendorId', { vendorId })
    .leftJoin('stocks.category', 'category')
    .addSelect(['category.id', 'category.name'])
    .leftJoin('stocks.product', 'product')
    .addSelect(['product.id', 'product.name'])
    .leftJoin('stocks.cylinderSize', 'cylinderSize')
    .addSelect(['cylinderSize.id', 'cylinderSize.cylinderSize'])
    .leftJoin('stocks.accessory', 'accessory')
    .addSelect(['accessory.id', 'accessory.name'])
    .offset(offset)
    .limit(limit);

  if (search && search !== '') {
    query.andWhere(
      new Brackets((qb) => {
        qb.where('category.name like :name', {
          name: '%' + search + '%',
        }).orWhere('product.name like :name', { name: '%' + search + '%' });
      }),
    );
  }

  if (startAt && endAt) {
    query.andWhere('stocks.addedAt BETWEEN :startAt AND :endAt', {
      startAt,
      endAt,
    });
  }

  if (categoryId && categoryId !== '') {
    query.andWhere('stocks.category = :categoryId', { categoryId });
  }

  if (productId && productId !== '') {
    query.andWhere('stocks.product = :productId', { productId });
  }

  if (accessoriesId && accessoriesId !== '') {
    query.andWhere('stocks.accessory = :accessoriesId', { accessoriesId });
  }

  if (cylinderSizeId && cylinderSizeId !== '') {
    query.andWhere('stocks.cylinderSize = :cylinderSizeId', { cylinderSizeId });
  }

  if (sort && sortBy === 'categoryName') {
    query.orderBy('category.name', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'accessoryName') {
    query.orderBy('accessory.name', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'productName') {
    query.orderBy('product.name', sort as 'ASC' | 'DESC');
  }

  const [vendorStock, count] = await query.getManyAndCount();
  res.status(200).json({ vendorStock, count });
};

export const vendorStockHistoryAppValidation = {
  query: Joi.object({
    categoryId: Joi.string().required(),
  }),
};
export const vendorStockHistoryApp = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: vendorId },
    query: { categoryId },
  } = req;
  const query = getManager()
    .createQueryBuilder(VendorStocks, 'stocks')
    .select([
      'stocks.id',
      'stocks.createdAt',
      'DATE_FORMAT(stocks.created_at, "%Y/%m/%d") AS drivers_created_date',
    ])
    .leftJoin('stocks.vendor', 'vendorDetails')
    .where('vendorDetails.user = :vendorId', { vendorId });

  // spareTank:1 ,Exchange:2
  if (Number(categoryId) === 1 || Number(categoryId) === 2) {
    query
      .andWhere('stocks.category = :categoryId', { categoryId })
      .leftJoin('stocks.cylinderSize', 'cylinderSize')
      .addSelect(['cylinderSize.id', 'cylinderSize.cylinderSize'])
      .leftJoin('stocks.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.logo'])
      .leftJoin('product.details', 'productDetails')
      .addSelect(['productDetails.indexPrice'])
      .addSelect(['stocks.addedFilled', 'stocks.addedEmpty', 'stocks.addedStockQty']);
  }

  // Accessories:3
  if (Number(categoryId) === 3) {
    query
      .andWhere('stocks.category = :categoryId', { categoryId })
      .leftJoin('stocks.accessory', 'accessory')
      .addSelect([
        'accessory.id',
        'accessory.name',
        'accessory.price',
        'accessory.image',
        'accessory.description',
      ])
      .addSelect(['stocks.addedFilled', 'stocks.addedEmpty', 'stocks.addedStockQty']);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let product: any = await query.getRawMany();

  if (Number(categoryId) === 3) {
    product = _.groupBy(product, 'drivers_created_date');
    product = Object.keys(product).map((key) => {
      return {
        date: key,
        data: product[key],
      };
    });
  }

  res.status(200).json({ product });
};

export const productDownListValidation = {
  query: Joi.object({
    category: Joi.number().required(),
  }),
};
export const productDownList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: vendorId },
    query: { category },
  } = req;

  let product;
  if (Number(category) === 1 || Number(category) === 2) {
    const query = getManager()
      .createQueryBuilder(VendorProductsPricing, 'VendorProductsPricing')
      .select('VendorProductsPricing.id')
      .where('VendorProductsPricing.category = :category', { category })
      .leftJoin('VendorProductsPricing.vendorProduct', 'vendorProduct')
      .andWhere('vendorProduct.vendor = :vendorId', { vendorId })
      .leftJoin('vendorProduct.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .groupBy('vendorProduct.product');
    product = await query.getRawMany();
  }

  if (Number(category) === 3) {
    const accessoriesIds = await getManager()
      .getRepository(VendorDetails)
      .findOne({ where: { user: vendorId } });

    const accessories = getManager()
      .createQueryBuilder(Accessories, 'accessories')
      .where('accessories.id IN (:...accessoriesId)', {
        accessoriesId: accessoriesIds?.accessoryIds,
      });
    product = await accessories.getRawMany();
  }
  res.json({ product });
};

export const cylinderSizeListValidation = {
  query: Joi.object({
    productId: Joi.string().required(),
  }),
};
export const cylinderSizeList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: vendorId },
    query: { productId },
  } = req;
  const query = getManager()
    .createQueryBuilder(VendorProducts, 'vendorProduct')
    .select('vendorProduct.id')
    .where('vendorProduct.product = :productId', { productId })
    .andWhere('vendorProduct.vendor = :vendorId', { vendorId })
    .leftJoin('vendorProduct.pricing', 'pricing')
    .leftJoin('pricing.cylinderSize', 'cylinderSize')
    .addSelect(['cylinderSize.id', 'cylinderSize.cylinderSize'])
    .groupBy('pricing.cylinderSize');

  const product = await query.getRawMany();

  res.status(200).json({ product });
};

export const updateLowStockValidation = {
  body: Joi.object({
    lowStockReminder: Joi.number().required(),
  }),
};
export const updateLowStock = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { lowStockReminder },
  } = req;

  const driverRepository = getCustomRepository(VendorDetailsRepository);
  const vendor = await driverRepository.findOneOrFail({
    where: {
      user,
    },
  });

  await driverRepository.update(vendor.id, {
    lowStockReminder,
  });

  res.sendStatus(204);
};
