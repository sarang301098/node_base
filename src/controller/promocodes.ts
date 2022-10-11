import {
  getRepository,
  getCustomRepository,
  getManager,
  Brackets,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { map, sample } from 'lodash';

import { BadRequestError, NotFoundError } from '../error';
import { PromoCodesRepository } from '../repository/Promocode';

import { Cart } from '../model/Cart';
import { Products } from '../model/Products';
import { PromoCodes } from '../model/Promocodes';

export const getPromocodesValidation = {
  query: Joi.object({
    orderType: Joi.number().integer().optional(),
    search: Joi.string().max(50).default(''),
    categoryId: Joi.number().integer().default(null),
    productId: Joi.number().integer().default(null),
    status: Joi.boolean().allow(true, false).default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    isFilters: Joi.boolean().default(true),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { orderType, search, page, perPage, categoryId, productId, status, isFilters },
  } = req;

  const promocodeRepository = getRepository(PromoCodes);
  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(PromoCodes, 'promoCodes')
    .leftJoin('promoCodes.product', 'product')
    .addSelect(['product.id', 'product.name', 'product.logo'])
    .offset(offset)
    .limit(limit);

  if (orderType) {
    query.andWhere('promoCodes.orderType = :orderType', { orderType });
  }

  if (categoryId && categoryId !== null) {
    query.andWhere('FIND_IN_SET(:categoryId, promoCodes.categoryIds)', {
      categoryId,
    });
  }

  if (productId && productId !== null) {
    query.andWhere('product.id = :productId', { productId });
  }

  if (search && search !== '') {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('promoCodes.title like :title', { title: '%' + search + '%' })
          .orWhere('promoCodes.promocode like :promocode', { promocode: '%' + search + '%' });
      }),
    );
  }

  if (status !== null) {
    query.andWhere('promoCodes.isActive = :status', { status });
  }

  const [promocodes, count] = isFilters
    ? await query.getManyAndCount()
    : await promocodeRepository.findAndCount({ relations: ['product'] });

  res.status(200).json({ count, promocodes });
};

export const createPromocodeValidation = {
  body: Joi.object({
    productId: Joi.number().required(),
    categoryIds: Joi.array()
      .items(Joi.number().integer().min(1).optional())
      .default(null)
      .optional(),
    customerIds: Joi.array().items(Joi.string().min(1).optional()).default(null).optional(),
    title: Joi.string().required(),
    promocode: Joi.string().required(),
    discount: Joi.number().required(),
    startAt: Joi.date().required(),
    endAt: Joi.date().required(),
    isActive: Joi.boolean().required(),
    orderType: Joi.number().required(),
  }),
};
export const createPromocode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: {
      productId,
      categoryIds,
      customerIds,
      title,
      promocode,
      discount,
      startAt,
      endAt,
      isActive,
      orderType,
    },
  } = req;

  const promocodeRepository = getRepository(PromoCodes);
  const existingPromocode = await promocodeRepository.findOne({
    where: {
      promocode,
      discount,
      startAt,
      endAt,
    },
  });

  if (existingPromocode) {
    throw new BadRequestError('Promocode is Already Exits', 'PROMOCODE_ALREADY_EXIST');
  }

  let promocodeData = promocodeRepository.create({
    customerIds,
    categoryIds,
    title,
    promocode,
    discount,
    startAt,
    endAt,
    isActive,
    orderType,
    product: await getManager().getRepository(Products).findOne(productId),
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  promocodeData = await promocodeRepository.save(promocodeData);
  res.status(201).json(promocodeData);
};

export const updatePromocodeValidation = {
  body: Joi.object({
    productId: Joi.number().required(),
    categoryIds: Joi.array().items(Joi.number().optional()).optional(),
    customerIds: Joi.array().items(Joi.string().optional()).optional(),
    title: Joi.string().required(),
    promocode: Joi.string().required(),
    discount: Joi.number().required(),
    startAt: Joi.date().required(),
    endAt: Joi.date().required(),
    isActive: Joi.boolean().required(),
  }),
};
export const updatePromocode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: {
      productId,
      categoryIds,
      customerIds,
      title,
      promocode,
      discount,
      startAt,
      endAt,
      isActive,
    },
    params: { id },
  } = req;

  const promocodeRepository = getCustomRepository(PromoCodesRepository);
  const promocodeById = await promocodeRepository.findOneOrFail({
    where: { id },
    relations: ['product'],
  });

  if (title && title !== undefined) promocodeById.title = title;
  if (endAt && endAt !== undefined) promocodeById.endAt = endAt;
  if (startAt && startAt !== undefined) promocodeById.startAt = startAt;
  if (discount && discount !== undefined) promocodeById.discount = discount;
  if (promocode && promocode !== undefined) promocodeById.promocode = promocode;
  if (categoryIds && categoryIds !== undefined) promocodeById.categoryIds = categoryIds;
  if (customerIds && customerIds !== undefined) promocodeById.customerIds = customerIds;
  if (isActive !== undefined) promocodeById.isActive = isActive;
  if (promocodeById?.product?.id !== productId) {
    promocodeById.product = await getManager().getRepository(Products).findOneOrFail(productId);
  }
  promocodeById.updatedBy = userId;

  await promocodeRepository.save(promocodeById);

  res.sendStatus(204);
};

export const deletePromocodeValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const removePromocode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(PromoCodes, { id }, { updatedBy: userId });
    await em.softDelete(PromoCodes, id);
  });

  res.sendStatus(204);
};

export const restorePromocodeValidation = {
  params: Joi.object({ id: Joi.number().integer().min(1).required() }),
};
export const restorePromocode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(PromoCodes, { id }, { updatedBy: userId });
    await em.restore(PromoCodes, id);
  });

  res.sendStatus(204);
};

export const checkPromocodeValidation = {
  body: Joi.object({
    promocode: Joi.string().min(1).required(),
    categoryId: Joi.number().integer().min(1).optional(),
  }),
};
export const checkPromocode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { promocode, categoryId },
  } = req;

  const promocodeRepository = getCustomRepository(PromoCodesRepository);
  const promocodeData = await promocodeRepository.findOne({
    where: {
      promocode,
      isActive: true,
      startAt: LessThanOrEqual(new Date()),
      endAt: MoreThanOrEqual(new Date()),
    },
    relations: ['product'],
    select: ['id', 'customerIds', 'orderType', 'discount', 'categoryIds'],
  });

  if (!promocodeData) {
    throw new NotFoundError(
      'Promocode is not valid for the selected Products',
      'PROMOCODE_NOT_APPLICABLE_FOR_PRODUCT',
    );
  }

  // check for the user
  if (!promocodeData?.customerIds?.includes(userId)) {
    throw new BadRequestError(
      'Promocode is not valid for the selected User',
      'PROMOCODE_NOT_APPLICABLE_FOR_USER',
    );
  }

  // check for the given category
  if (categoryId && !promocodeData?.categoryIds?.includes((categoryId || '').toString())) {
    throw new BadRequestError(
      'Promocode is not valid for the category',
      'PROMOCODE_NOT_APPLICABLE_FOR_CATEGORY',
    );
  }

  // get all the cart data
  const cartQuery = getManager()
    .createQueryBuilder(Cart, 'cart')
    .leftJoin('cart.user', 'user')
    .where('user.id = :userId', { userId })
    .leftJoin('cart.product', 'product')
    .addSelect(['product.id'])
    .andWhere('product.id = :productId', { productId: promocodeData?.product?.id });

  const availableCart = await cartQuery.getMany();

  const randomProduct = sample(
    map(availableCart, (cart) => {
      return { cartId: cart?.id || '', randomProductId: cart?.product?.id || '' };
    }),
  );

  if (!randomProduct || !availableCart.length) {
    throw new BadRequestError(
      `Promocode ${promocode} is not applicable to any of the current cart products`,
      'PROMOCODE_NOT_APPLICABLE',
    );
  }

  // manage response
  const response = {
    ...randomProduct,
    promocodeId: promocodeData?.id,
    discount: promocodeData?.discount,
    code: 'PROMOCODE_NOT_APPLIED',
    message: 'Promocode not applied',
  };

  if (promocodeData?.id && randomProduct?.cartId) {
    const cartRepository = getRepository(Cart);
    await cartRepository.update(randomProduct?.cartId, {
      promocode: promocodeData,
    });
    response.code = 'PROMOCODE_APPLIED_SUCCES';
    response.message = 'Promocode applied successfully';
  }

  res.status(200).json(response);
};

export const applyPromocodeValidation = {
  body: Joi.object({
    promocode: Joi.string().min(1).required(),
    categoryId: Joi.number().integer().min(1).optional(),
    productId: Joi.number().integer().min(1).required(),
    orderType: Joi.number().integer().required(),
  }),
};
export const applyPromocode = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { promocode, categoryId, productId, orderType },
  } = req;

  const query = getManager()
    .createQueryBuilder(PromoCodes, 'promoCodes')
    .where('promoCodes.promocode = :promocode', { promocode })
    .where('promoCodes.product_id = :productId', { productId })
    .andWhere('promoCodes.orderType = :orderType', { orderType })
    .andWhere('promoCodes.isActive = :isActive', { isActive: true })
    .andWhere(
      'promoCodes.startAt <= CURRENT_TIMESTAMP() AND promoCodes.endAt >= CURRENT_TIMESTAMP()',
    )
    .andWhere('FIND_IN_SET(:userId, promocode.customerIds)', { userId });

  if (categoryId && categoryId !== null) {
    query.andWhere('FIND_IN_SET(:categoryId, promocode.categoryIds)', { categoryId });
  }

  // manage response
  const response = {
    promocodeId: 0,
    code: 'PROMOCODE_NOT_APPLIED',
    message: 'Promocode not applied',
  };

  const promocodeData = await query.getOne();
  if (promocodeData && promocodeData?.id) {
    response.promocodeId = Number(promocodeData?.id);
    response.code = 'PROMOCODE_APPLIED_SUCCES';
    response.message = 'Promocode applied successfully';
  }

  res.status(200).json(response);
};

export const getPromocodeByIdValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
/**
 * Title: Get Promocode by Id API;
 * Created By: Sarang Patel;
 * steps:
 *    1) Find promocode data based on the Id from the params with all relations.
 */
export const getById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const promocodeRepository = getCustomRepository(PromoCodesRepository);
  const promocode = await promocodeRepository.findOne({ where: { id }, relations: ['product'] });

  res.status(200).json(promocode);
};
