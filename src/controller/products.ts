import { getRepository, getManager, Not, In } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { uniq, map } from 'lodash';

import { BadRequestError } from '../error';

import { Users } from '../model/Users';
import { Products } from '../model/Products';
import { Accessories } from '../model/Accessory';
import { Categories } from '../model/Categories';
import { UserSubscription } from '../model/UserSubscription';
import { ProductsDetails } from '../model/ProductDetails';

const getAllVendorsByAccessoryId = (
  vendorsAccessory: Map<string, Array<number | string> | null>,
  accessoryId: string | number,
) => {
  let ids: Array<string | number> = [];
  for (const [key, value] of vendorsAccessory.entries()) {
    if (vendorsAccessory.has(key) && (value || '').indexOf(accessoryId.toString()) > -1) {
      ids = [...ids, key];
    }
  }
  return ids;
};

export const getProductsValidation = {
  query: Joi.object({
    search: Joi.string().min(1).optional().optional(),
    categoryId: Joi.number().integer().optional(),
    orderType: Joi.number().optional().default(null),
    categoryIds: Joi.array()
      .items(
        Joi.alternatives(Joi.number().integer().min(0).required(), Joi.string().min(1).required()),
      )
      .allow(null),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, categoryId, orderType, categoryIds },
  } = req;

  const query = getManager()
    .createQueryBuilder(Products, 'product')
    .leftJoin('product.details', 'productDetails')
    .addSelect([
      'productDetails.category',
      'productDetails.id',
      'productDetails.indexPrice',
      'productDetails.discount',
    ])
    .leftJoin('productDetails.category', 'category')
    .addSelect(['category.id', 'category.name']);

  if (search && search !== '') {
    query.andWhere('product.name like :name', { name: '%' + search + '%' });
  }
  if (categoryId && categoryId !== '') {
    query.andWhere('category.id = :categoryId', { categoryId });
  }
  if (categoryIds && categoryIds.length) {
    query.andWhere('category.id IN (:...categoryIds)', { categoryIds });
  }
  if (orderType !== null) {
    query.andWhere('product.orderType = :orderType', { orderType });
  }

  const [products, count] = await query.getManyAndCount();

  res.status(200).json({ count, products });
};

const namePattern = '^[A-za-z]';
export const createProductValidation = {
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    orderType: Joi.number().integer().required(),
    status: Joi.number().required(),
    logo: Joi.string().required(),
    details: Joi.array()
      .items(
        Joi.object({
          categoryId: Joi.number().optional(),
          indexPrice: Joi.number().default(0),
          discount: Joi.number().default(0),
        }),
      )
      .default(null),
  }),
};
export const createProduct = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { orderType, name, status, logo, details },
  } = req;

  const productRepo = getRepository(Products);
  const categoryRepo = getRepository(Categories);
  const productDetailRepo = getRepository(ProductsDetails);

  const existingProduct = await productRepo.findOne({ where: { orderType, name } });
  if (existingProduct) {
    throw new BadRequestError('product Already Exist', 'PRODUCT_ALREADY_EXIST');
  }

  let newProduct = productRepo.create({
    name,
    status,
    logo,
    orderType,
    details: [],
  });

  newProduct = await productRepo.save(newProduct);

  if (details && details.length) {
    for (let index = 0; index < details?.length; index++) {
      const category = await categoryRepo.findOne({
        where: { id: details[index]?.categoryId },
        select: ['id', 'name'],
      });

      let productDetail: ProductsDetails;
      productDetail = productDetailRepo.create({
        indexPrice: details[index]?.indexPrice,
        discount: details[index]?.discount,
        category,
        product: newProduct,
        createdBy: user?.id,
        updatedBy: user?.id,
      });
      productDetail = await productDetailRepo.save(productDetail);

      // Removed Unnecessory Response
      newProduct.details.push(
        Object.assign({}, productDetail, {
          product: undefined,
          isActive: undefined,
          productId: undefined,
          categoryId: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          createdBy: undefined,
          updatedBy: undefined,
          deletedAt: undefined,
        }),
      );
    }
  }

  res.status(201).json(newProduct);
};

export const updateProductValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
  body: Joi.object({
    name: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    status: Joi.number().integer().required(),
    orderType: Joi.number().integer().required(),
    logo: Joi.string().required(),
    details: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().integer().integer().optional(),
          categoryId: Joi.number().integer().optional(),
          indexPrice: Joi.number().default(0),
          discount: Joi.number().default(0),
          isDeleted: Joi.boolean().optional(),
        }),
      )
      .default(null),
  }),
};
export const updateProduct = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { name, status, logo, details, orderType },
    params: { id },
  } = req;

  const categoryRepo = getRepository(Categories);
  const productRepo = getRepository(Products);
  const productDetailRepo = getRepository(ProductsDetails);

  let product = await productRepo.findOneOrFail({ where: { id }, relations: ['details'] });
  const uniqProduct = await productRepo.findOne({
    where: { id: Not(id), name, orderType },
  });
  if (uniqProduct) {
    throw new BadRequestError(`Product with name: ${name} already exist`, 'PRODUCT_ALREADY_EXIST');
  }

  product = Object.assign({}, product, { name, status, logo });
  await productRepo.save(product);

  if (details && details.length) {
    for (let index = 0; index < details?.length; index++) {
      if (details[index]?.isDeleted) {
        await getManager().transaction(async (em) => {
          await em.update(ProductsDetails, { id: details[index]?.id }, { updatedBy: user?.id });
          await em.softDelete(ProductsDetails, details[index]?.id);
        });
      } else {
        let productDetail = await productDetailRepo.findOne({
          where: { id: details[index]?.id },
          relations: ['category'],
        });

        const category = await categoryRepo.findOne({
          where: { id: details[index]?.categoryId },
        });

        // TODO: provide more validation if possible. like: details[index]?.categoryId !== productDetail?.category?.id
        if (productDetail) {
          productDetail = Object.assign({}, productDetail, {
            indexPrice: details[index]?.indexPrice,
            discount: details[index]?.discount,
            category,
            updatedBy: user?.id,
          });
        } else {
          productDetail = productDetailRepo.create({
            indexPrice: details[index]?.indexPrice,
            discount: details[index]?.discount,
            category,
            product,
            createdBy: user?.id,
            updatedBy: user?.id,
          });
        }
        productDetail = await productDetailRepo.save(productDetail);
      }
    }
  }

  res.sendStatus(204);
};

export const deleteProductValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const removeProduct = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  // TODO: Remove Product but Product Details removation is pending.
  await getManager().transaction(async (em) => {
    await em.update(Products, { id }, { updatedBy: userId });
    await em.softDelete(Products, id);
    // await em.update(ProductsDetails, { productId: id }, { updatedBy: userId });
    // await em.softDelete(ProductsDetails, { productId: id });
  });

  res.sendStatus(204);
};

export const getProductsOfVendorsByZipcodeValidation = {
  query: Joi.object({
    zipcodeId: Joi.number().integer().min(1).required(),
    orderType: Joi.number().integer().min(0).max(4).required(),
    categoryId: Joi.when('orderType', {
      is: 2,
      then: Joi.number().integer().min(0).max(4).required(),
      otherwise: Joi.forbidden(),
    }),
  }),
};
export const getProductsOfVendorsByZipcode = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    user: { id: userId },
    query: { zipcodeId, orderType, categoryId },
  } = req;

  // get all subscriptions.
  const subscription = getManager()
    .createQueryBuilder(UserSubscription, 'subscription')
    .where(
      'subscription.startDate <= CURRENT_TIMESTAMP() AND subscription.endDate >= CURRENT_TIMESTAMP() AND subscription.isActive = true AND subscription.status = 2',
    )
    .andWhere('subscription.user_id = :userId', { userId })
    .leftJoinAndSelect('subscription.membershipPlan', 'membershipPlan');

  if (categoryId && categoryId !== null) {
    subscription.andWhere('FIND_IN_SET(:categoryId, membershipPlan.categoryIds)', { categoryId });
  }
  if (orderType && orderType !== null) {
    subscription.andWhere('membershipPlan.type = :orderType', { orderType });
  }

  const activeSubscriptions = await subscription.getMany();

  let response;
  if (Number(orderType) === 1 || (Number(orderType) === 2 && Number(categoryId) !== 3)) {
    const query = getManager()
      .createQueryBuilder(Products, 'product')
      .where('product.isActive = :isActive AND product.orderType = :orderType', {
        isActive: true,
        orderType,
      })
      .leftJoin('product.details', 'details')
      .addSelect(['details.id', 'details.indexPrice', 'details.discount'])
      .leftJoin('details.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .leftJoin(
        'product.vendorProducts',
        'vendorProducts',
        'vendorProducts.product_id = product.id',
      )
      .addSelect(['vendorProducts.id']);

    // Append of query in the middle
    if (categoryId) {
      query.innerJoin('vendorProducts.pricing', 'pricing', 'pricing.category_id = :categoryId', {
        categoryId,
      });
    }

    // continue
    query
      .leftJoin('vendorProducts.vendor', 'vendor')
      .andWhere('vendor.stripeAccountId IS NOT NULL')
      .addSelect(['vendor.id'])
      .innerJoin(
        'vendor.vendor',
        'vendorDetails',
        'vendorDetails.profileCompletedStatus >= 6 AND vendorDetails.status = :status',
        { status: 1 },
      )
      .andWhere('FIND_IN_SET(:zipcodeId, vendorDetails.zipcodeIds)', { zipcodeId })
      .addSelect(['vendorDetails.id']);

    const products = await query.getMany();

    if (products && products.length) {
      response = products.map((prod) => {
        return {
          ...prod,
          vendorIds: uniq(map(prod?.vendorProducts, 'vendor.id') || []),
          vendorProducts: undefined,
        };
      });
    }
  } else if (Number(orderType) === 2 && Number(categoryId) === 3) {
    const vendors = await getManager()
      .createQueryBuilder(Users, 'users')
      .andWhere('users.stripeAccountId IS NOT NULL')
      .leftJoin(
        'users.vendor',
        'vendorDetail',
        'vendorDetail.profileCompletedStatus >= 6 AND vendorDetail.status = :status',
        { status: 1 },
      )
      .andWhere('FIND_IN_SET(:zipcodeId, vendorDetail.zipcodeIds)', { zipcodeId })
      .addSelect(['vendorDetail.id', 'vendorDetail.zipcodeIds', 'vendorDetail.accessoryIds'])
      .getMany();

    const vendorsAccessory = new Map<string, Array<number | string> | null>();
    let accessoryIds: Array<number | string> = [];
    if (vendors && vendors.length) {
      for (let index = 0; index < vendors.length; index++) {
        vendorsAccessory.set(vendors[index]?.id, vendors[index].vendor?.accessoryIds);
        accessoryIds = uniq([...accessoryIds, ...(vendors[index]?.vendor?.accessoryIds || [])]);
      }
    }

    if (accessoryIds && accessoryIds.length) {
      const accessoryRepository = getRepository(Accessories);
      const accessories = await accessoryRepository.find({
        where: { id: In(accessoryIds), status: 1 },
      });

      if (accessories && accessories.length) {
        response = accessories.map((prod) => {
          return {
            ...prod,
            vendorIds: getAllVendorsByAccessoryId(vendorsAccessory, prod?.id),
          };
        });
      }
    }
  }

  res.status(200).json({ response: response || [], activeSubscriptions });
};

export const getProductByIdValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const getProductById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const query = getManager()
    .createQueryBuilder(Products, 'product')
    .where('product.id = :id', { id })
    .leftJoin('product.details', 'productDetails')
    .addSelect([
      'productDetails.id',
      'productDetails.category',
      'productDetails.indexPrice',
      'productDetails.discount',
    ])
    .leftJoin('productDetails.category', 'category')
    .addSelect(['category.id', 'category.name']);

  const product = await query.getOne();
  res.status(200).json({ product });
};
