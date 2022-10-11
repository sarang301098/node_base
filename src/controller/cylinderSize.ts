import {
  getRepository,
  getCustomRepository,
  FindConditions,
  ILike,
  getManager,
  Not,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { BadRequestError } from '../error';
import { CylinderSizesRepository } from '../repository/CylinderSizes';

import { CylinderSizes } from '../model/CylinderSizes';
import { VendorProductsPricing } from '../model/VendorProductPricing';
import _ from 'lodash';
import { ProductsDetails } from '../model/ProductDetails';

export const getCylinderSizesValidation = {
  query: Joi.object({
    search: Joi.string().max(50).optional().default(''),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isFilters: Joi.boolean().optional().default(true),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, isFilters },
  } = req;

  const cylinderSizeRepository = getCustomRepository(CylinderSizesRepository);
  let where: FindConditions<CylinderSizes> = {};
  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  if (search && search !== '') {
    where = { ...where, cylinderSize: ILike(Number(search)) };
  }

  const [cylinderSizes, count] = isFilters
    ? await cylinderSizeRepository.findAndCount({
        where,
        take: limit,
        skip: offset,
      })
    : await cylinderSizeRepository.findAndCount({ select: ['id', 'cylinderSize'] });
  res.status(200).json({ count, cylinderSizes });
};

export const createCylinderSizeValidation = {
  body: Joi.object({
    cylinderSize: Joi.number().precision(2).required().default(0),
  }),
};
export const createCylinderSize = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { cylinderSize },
  } = req;

  const cylinderSizeRepository = getRepository(CylinderSizes);
  const existingCylinderSize = await cylinderSizeRepository.findOne({
    where: { cylinderSize },
  });

  if (existingCylinderSize) {
    throw new BadRequestError(`Cylinder size is already added`, 'CYLINDERSIZE_ALREADY_EXIST');
  }

  let cylinderSizeData = cylinderSizeRepository.create({
    status: 1,
    cylinderSize,
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  cylinderSizeData = await cylinderSizeRepository.save(cylinderSizeData);
  await cylinderSizeRepository.save(cylinderSizeData);

  res.status(201).json(cylinderSizeData);
};

export const updateCylinderSizeValidation = {
  body: Joi.object({
    cylinderSize: Joi.number().precision(2).required().default(0),
  }),
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const updateCylinderSize = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { cylinderSize },
    params: { id },
  } = req;
  const cylinderSizeRepository = getRepository(CylinderSizes);

  let sizeToUpdate = await cylinderSizeRepository.findOneOrFail(id);
  const uniqCylinder = await cylinderSizeRepository.findOne({
    where: { id: Not(id), cylinderSize },
  });
  if (uniqCylinder) {
    throw new BadRequestError(`Cylinder size is already added`, 'CYLINDER_ALREADY_EXIST');
  }

  sizeToUpdate = Object.assign({}, sizeToUpdate, {
    cylinderSize,
    updatedBy: user?.id,
  });

  await cylinderSizeRepository.save(sizeToUpdate);

  res.sendStatus(204).json({ accessoryToUpdate: sizeToUpdate });
};

export const deleteCylinderSizeValidation = {
  params: Joi.object({ id: Joi.number().integer().required() }),
};
export const removeCylinderSize = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(CylinderSizes, { id }, { updatedBy: userId });
    await em.softDelete(CylinderSizes, id);
  });

  res.sendStatus(204);
};

export const getByVendorsProductValidation = {
  query: Joi.object({
    productId: Joi.number().min(0).required(),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
    orderType: Joi.number().min(0).max(3).required(),
    categoryId: Joi.number().min(0).required(),
  }),
};
export const getByVendorsProduct = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { productId, vendorId, orderType, categoryId },
  } = req;

  const query = getManager()
    .createQueryBuilder(VendorProductsPricing, 'vendorProductsPricing')
    .where('vendorProductsPricing.category =:categoryId', { categoryId })
    .leftJoin('vendorProductsPricing.cylinderSize', 'cylinderSize')
    .addSelect(['cylinderSize.id', 'cylinderSize.cylinderSize'])
    .leftJoin('vendorProductsPricing.vendorProduct', 'vendorProduct')
    .andWhere('vendorProduct.vendor_id =:vendorId', { vendorId })
    .andWhere('vendorProduct.product_id =:productId', { productId })
    .andWhere('vendorProduct.orderType =:orderType', { orderType })
    .leftJoin('vendorProductsPricing.vendorProductTiers', 'vendorProductTiers')
    .addSelect([
      'vendorProductTiers.id',
      'vendorProductTiers.to',
      'vendorProductTiers.from',
      'vendorProductTiers.position',
    ]);

  const products = await query.getMany();

  const productDetails = await getManager()
    .createQueryBuilder(ProductsDetails, 'productsDetails')
    .andWhere('productsDetails.product_id =:productId', { productId })
    .andWhere('productsDetails.category_id =:categoryId', { categoryId })
    .getOne();

  const pricingMap = new Map();
  for (let i = 0; i < products.length; i++) {
    if (!pricingMap.has(products[i].cylinderSizeId)) {
      const obj = {
        indexPrice: productDetails?.indexPrice,
        vendorProductId: products[i]?.vendorProductId,
        cylinderSize: products[i]?.cylinderSize?.cylinderSize,
        cylinderSizeId: products[i]?.cylinderSize?.id,
        categoryId: products[i]?.categoryId,
        vendorProductTiers: [
          {
            ...products[i]?.vendorProductTiers,
            price: products[i]?.price,
          },
        ],
      };
      pricingMap.set(products[i]?.cylinderSizeId, obj);
    } else {
      const pricing = pricingMap.get(products[i]?.cylinderSizeId);
      pricing.vendorProductTiers.push({
        ...products[i]?.vendorProductTiers,
        price: products[i]?.price,
      });
    }
  }

  const cylinderArr = [];
  for (const [, value] of pricingMap.entries()) {
    cylinderArr.push(value);
  }

  res.json({ cylinderArr });
};
