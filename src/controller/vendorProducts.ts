import { getRepository, getCustomRepository, getManager, Not } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';

import { Users } from '../model/Users';
import { Products } from '../model/Products';
import { Categories } from '../model/Categories';
import { CylinderSizes } from '../model/CylinderSizes';
import { VendorProducts } from '../model/VendorProducts';
import { VendorProductTiers } from '../model/VendorProductTiers';
import { VendorProductsPricing } from '../model/VendorProductPricing';

import { VendorProductsRepository } from '../repository/VendorProducts';

import { PropaneUserType } from '../constants';

const pricingTypeOne = [
  { from: 0, to: 99, position: 1 },
  { from: 100, to: 249, position: 2 },
  { from: 250, to: 499, position: 3 },
  { from: 500, to: 999, position: 4 },
  { from: 1000, to: 2147483647, position: 5 },
];

const pricingTypeTwo = [
  { from: 0, to: 3, position: 1 },
  { from: 4, to: 6, position: 2 },
  { from: 7, to: 10, position: 3 },
  { from: 11, to: 2147483647, position: 4 },
];

type ITierType = {
  id: number;
  to: number;
  from: number;
};

interface Tires {
  id: number;
  quantity: string;
  price: number;
  from: number;
  to: number;
}
interface VenderTiers {
  orderType: number;
  logo: string;
  name: string;
  tiers: Tires[];
}

export const getAllValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    orderType: Joi.number().min(1).allow(1, 2).required(),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { vendorId, orderType },
  } = req;

  const query = getManager()
    .createQueryBuilder(VendorProducts, 'vendorProducts')
    .where('vendorProducts.orderType = :orderType', { orderType })
    .leftJoin('vendorProducts.vendor', 'vendor')
    .andWhere('vendor.id = :vendorId', { vendorId })
    .leftJoinAndSelect('vendorProducts.product', 'product')
    .leftJoinAndSelect('vendorProducts.pricing', 'pricing')
    .leftJoinAndSelect('product.details', 'details')
    .leftJoinAndSelect('vendorProducts.tiers', 'tiers');

  const [vendorProducts, count] = await query.getManyAndCount();
  res.status(200).json({ vendorProducts, count });
};

export const createVendorProductValidation = {
  body: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    productId: Joi.number().min(0).required(),
    orderType: Joi.number().min(1).allow(1, 2).required(),
    isSalesTax: Joi.boolean().required().default(true),
  }),
};
export const createVendorProducts = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { vendorId, productId, isSalesTax, orderType },
  } = req;

  const usersRepo = getRepository(Users);
  const productsRepo = getRepository(Products);
  const vendorProductsRepo = getCustomRepository(VendorProductsRepository);
  const vendorProductTiersRepo = getRepository(VendorProductTiers);

  const product = await productsRepo.findOne({
    where: { id: productId, orderType },
    relations: ['details'],
  });
  const vendor = await usersRepo.findOne({
    where: { id: vendorId, userType: PropaneUserType.VENDOR },
  });
  if (!vendor) {
    throw new BadRequestError('Vendor is not available', 'VENDOR_NOT_FOUND');
  }

  const existingVendorProduct = await vendorProductsRepo.findOne({ where: { product, vendor } });
  if (existingVendorProduct) {
    throw new BadRequestError(
      'Product pricing is already available',
      'PRODUCT_PRICING_ALREADY_AVAILABLE',
    );
  }

  let newVendorProduct = vendorProductsRepo.create({
    vendor,
    product,
    orderType,
    isSalesTax,
    createdBy: userId,
    updatedBy: userId,
  });

  newVendorProduct = await vendorProductsRepo.save(newVendorProduct);

  // Filter
  newVendorProduct = Object.assign({}, newVendorProduct, { vendor: undefined, product: undefined });

  // Tiers
  let vendorProductTiers = orderType === 1 ? pricingTypeOne : pricingTypeTwo;
  if (vendorProductTiers && vendorProductTiers.length) {
    vendorProductTiers = vendorProductTiers.map((tier) =>
      vendorProductTiersRepo.create({
        ...tier,
        vendorProduct: newVendorProduct,
        createdBy: userId,
        updatedBy: userId,
      }),
    );
  }

  vendorProductTiers = await vendorProductTiersRepo.save(vendorProductTiers);

  const vendorProduct = await vendorProductsRepo.getByRelatioins(newVendorProduct?.id, [
    'tiers',
    'pricing',
    'product',
    'product.details',
  ]);

  res.status(201).json({ vendorProduct });
};

export const updateVendorProductValidation = {
  body: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    productId: Joi.number().min(0).required(),
    isSalesTax: Joi.boolean().required().default(true),
  }),
  params: Joi.object({ id: Joi.number().integer().min(0).required() }),
};
export const updateVendorProducts = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { vendorId, productId, isSalesTax },
    params: { id },
  } = req;

  const usersRepo = getRepository(Users);
  const productsRepo = getRepository(Products);
  const vendorProductsRepo = getRepository(VendorProducts);

  const product = await productsRepo.findOne({ where: { id: productId }, relations: ['details'] });
  const vendor = await usersRepo.findOne(vendorId);

  const existingVendorProduct = await vendorProductsRepo.findOne({
    where: { id: Not(id), product, vendor },
  });
  if (existingVendorProduct) {
    throw new BadRequestError(
      'Product pricing is already available',
      'PRODUCT_PRICING_ALREADY_AVAILABLE',
    );
  }

  await vendorProductsRepo.update(id, { product, isSalesTax, updatedBy: userId });

  res.sendStatus(204);
};

export const updateVendorProductPricingTiersValidation = {
  body: Joi.object({
    tiers: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().min(0).required(),
          from: Joi.number().integer().min(-1).required(),
          to: Joi.number().integer().min(-1).required(),
        }),
      )
      .allow(null)
      .optional(),
  }),
};
export const updateVendorProductPricingTiers = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  let {
    user: { id: userId },
    body: { tiers },
  } = req;

  const vendorProductTiersRepo = getRepository(VendorProductTiers);
  if (tiers && tiers.length) {
    tiers = tiers.map((tier: ITierType) => {
      return {
        ...tier,
        updatedBy: userId,
      };
    });

    await vendorProductTiersRepo.save(tiers);
  }
  res.sendStatus(204);
};

export const addProductPricingValidation = {
  body: Joi.object({
    pricing: Joi.array()
      .items(
        Joi.object({
          categoryId: Joi.number().integer().min(0).optional(),
          cylinderSizeId: Joi.number().integer().min(0).optional(),
          vendorProductTierId: Joi.number().integer().min(0).required(),
          vendorProductId: Joi.number().integer().min(0).required(),
          price: Joi.number().min(0).required(),
        }),
      )
      .allow(null)
      .optional(),
  }),
};
export const addProductPricing = () => async (req: Request, res: Response): Promise<void> => {
  let {
    user: { id: userId },
    body: { pricing },
  } = req;

  const categoryRepo = getRepository(Categories);
  const cylinderSizeRepo = getRepository(CylinderSizes);
  const vendorProductsRepo = getRepository(VendorProducts);
  const vendorProductTiersRepo = getRepository(VendorProductTiers);
  const vendorProductPricingRepo = getRepository(VendorProductsPricing);

  if (pricing && pricing.length) {
    for (let index = 0; index < pricing.length; index++) {
      pricing[index] = {
        price: pricing[index]?.price,
        category:
          pricing[index]?.categoryId && (await categoryRepo.findOne(pricing[index]?.categoryId)),
        cylinderSize:
          pricing[index]?.cylinderSizeId &&
          (await cylinderSizeRepo.findOne(pricing[index]?.cylinderSizeId)),
        vendorProductTiers:
          pricing[index]?.vendorProductTierId &&
          (await vendorProductTiersRepo.findOne(pricing[index]?.vendorProductTierId)),
        vendorProduct:
          pricing[index]?.vendorProductId &&
          (await vendorProductsRepo.findOne(pricing[index]?.vendorProductId)),
        createdBy: userId,
        updatedBy: userId,
      };
    }
  }
  pricing = await vendorProductPricingRepo.save(pricing);

  if (pricing && pricing.length) {
    pricing = pricing.map((price: VendorProductsPricing) => {
      return {
        ...price,
        vendorProductTiers: '',
        vendorProduct: '',
        cylinderSize: '',
        category: '',
      };
    });
  }
  res.status(200).json({ pricing });
};

export const updateProductPricingValidation = {
  body: Joi.object({
    pricing: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().min(0).required(),
          categoryId: Joi.number().integer().min(0).optional(),
          cylinderSizeId: Joi.number().integer().min(0).optional(),
          price: Joi.number().min(0).required(),
        }),
      )
      .allow(null)
      .optional(),
  }),
};
export const updateProductPricing = () => async (req: Request, res: Response): Promise<void> => {
  let {
    user: { id: userId },
    body: { pricing },
  } = req;

  const categoryRepo = getRepository(Categories);
  const cylinderSizeRepo = getRepository(CylinderSizes);
  const vendorProductPricingRepo = getRepository(VendorProductsPricing);

  if (pricing && pricing.length) {
    for (let index = 0; index < pricing.length; index++) {
      pricing[index] = {
        id: pricing[index]?.id,
        price: pricing[index]?.price,
        category:
          pricing[index]?.categoryId && (await categoryRepo.findOne(pricing[index]?.categoryId)),
        cylinderSize:
          pricing[index]?.cylinderSizeId &&
          (await cylinderSizeRepo.findOne(pricing[index]?.cylinderSizeId)),
        createdBy: userId,
        updatedBy: userId,
      };
    }
  }

  pricing = await vendorProductPricingRepo.save(pricing);
  res.sendStatus(204);
};

export const deleteVendorProductValidation = {
  params: Joi.object({ id: Joi.number().integer().min(0).required() }),
};
export const removeVendorProduct = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const vendorProductsRepo = getRepository(VendorProducts);
  const vendorProduct = await vendorProductsRepo.findOne({
    where: { id },
    relations: ['tiers', 'pricing'],
  });

  if (!vendorProduct) {
    throw new BadRequestError('Pricing for the product not found', 'PRICING_NOT_FOUND');
  }

  await getManager().transaction(async (em) => {
    await em.update(VendorProducts, { id }, { updatedBy: userId });
    await em.softDelete(VendorProducts, id);
    if (vendorProduct && vendorProduct?.tiers?.length) {
      await em.update(VendorProductTiers, [...vendorProduct?.tiers], {
        updatedBy: userId,
      });
      await em.softDelete(VendorProductTiers, [...vendorProduct?.tiers]);
    }
    if (vendorProduct && vendorProduct?.pricing?.length) {
      await em.update(VendorProductsPricing, [...vendorProduct?.pricing], { updatedBy: userId });
      await em.softDelete(VendorProductsPricing, [...vendorProduct?.pricing]);
    }
  });

  res.sendStatus(204);
};

export const deleteVendorProductPricingValidation = {
  body: Joi.object({ ids: Joi.array().items(Joi.number().integer().min(0).required()).required() }),
};
export const removeVendorProductPricing = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    user: { id: userId },
    body: { ids },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(VendorProductsPricing, [...ids], { updatedBy: userId });
    await em.softDelete(VendorProductsPricing, [...ids]);
  });

  res.sendStatus(204);
};

export const getproductPricingValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    orderType: Joi.number().min(1).allow(1, 2).required(),
    productId: Joi.number().min(1).optional(),
    cylinderSizeId: Joi.number().min(1).optional(),
    search: Joi.string().max(50).allow(null).default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    startAt: Joi.date().optional(),
    endAt: Joi.date().optional(),
  }),
};
export const getproductPricing = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: {
      orderType,
      vendorId,
      productId,
      cylinderSizeId,
      search,
      startAt,
      endAt,
      page,
      perPage,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(VendorProducts, 'vendorProducts')
    .where('vendorProducts.orderType = :orderType', { orderType })
    .andWhere('vendorProducts.vendor_id = :vendorId', { vendorId })
    .leftJoinAndSelect('vendorProducts.product', 'product')
    .leftJoinAndSelect('product.details', 'productDetails')
    .leftJoinAndSelect('vendorProducts.tiers', 'tiers')
    .leftJoinAndSelect('vendorProducts.pricing', 'pricing')
    .leftJoinAndSelect('pricing.cylinderSize', 'cylinderSize')
    .take(limit)
    .skip(offset);

  if (search && search !== '') {
    query.andWhere('product.name like :name', { name: '%' + search + '%' });
  }

  if (productId && productId !== null) {
    query.andWhere('vendorProducts.product_id = :productId', { productId });
  }

  if (cylinderSizeId && cylinderSizeId !== null) {
    query.andWhere('pricing.cylinder_size_id = :cylinderSizeId', { cylinderSizeId });
  }

  if (startAt && endAt) {
    query.andWhere('vendorProducts.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  const [vendorProducts, count] = await query.getManyAndCount();
  res.status(200).json({ vendorProducts, count });
};

export const getAppProductPricingValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    orderType: Joi.number().min(1).allow(1, 2).required(),
    productId: Joi.number().min(1).required(),
    cylinderSizeId: Joi.number().min(1).optional(),
    categoryId: Joi.number().min(1).optional(),
  }),
};
export const getAppProductPricing = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { orderType, vendorId, productId, cylinderSizeId, categoryId },
  } = req;

  const query = getManager()
    .createQueryBuilder(VendorProducts, 'vendorProducts')
    .where('vendorProducts.orderType = :orderType', { orderType })
    .andWhere('vendorProducts.vendor_id = :vendorId', { vendorId })
    .leftJoin('vendorProducts.product', 'product')
    .andWhere('product.id = :productId', { productId })
    .addSelect(['product.id', 'product.logo', 'product.name'])
    .leftJoinAndSelect('vendorProducts.tiers', 'tiers')
    .leftJoinAndSelect('vendorProducts.pricing', 'pricing');

  if (cylinderSizeId && cylinderSizeId !== '') {
    query.andWhere('pricing.cylinder_size_id = :cylinderSizeId', { cylinderSizeId });
  }

  if (categoryId && categoryId !== '') {
    query.andWhere('pricing.category_id = :categoryId', { categoryId });
  }

  const vendorProducts = await query.getOne();

  // const pricingMap = new Map();
  const venderTiers: VenderTiers = {
    orderType: vendorProducts?.orderType as number,
    logo: vendorProducts?.product?.logo as string,
    name: vendorProducts?.product?.name as string,
    tiers: [],
  };

  // if (vendorProducts?.pricing?.length)
  //   for (let i = 0; i < vendorProducts?.pricing?.length; i++) {
  //     pricingMap.set(vendorProducts?.pricing[i].id, vendorProducts?.pricing[i].price);
  //   }

  if (vendorProducts?.tiers?.length)
    for (let i = 0; i < vendorProducts?.tiers?.length; i++) {
      venderTiers.tiers.push({
        id: vendorProducts?.tiers[i].id,
        from: vendorProducts?.tiers[i].from,
        to: vendorProducts?.tiers[i].to,
        // price: pricingMap.get(vendorProducts?.tiers[i].id),
        price: vendorProducts?.pricing[i]?.price as number,
        quantity: `${vendorProducts?.tiers[i].from} - ${vendorProducts?.tiers[i].to}`,
      });
    }
  res.status(200).json({ venderTiers });
};
