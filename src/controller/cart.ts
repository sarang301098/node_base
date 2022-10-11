import { getCustomRepository, getManager } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import { CartRepository } from '../repository/Cart';

import GetCart from '../service/GetCart';

import { Cart } from '../model/Cart';
import { Users } from '../model/Users';
import { Products } from '../model/Products';
import { ZipCodes } from '../model/ZipCodes';
import { TimeSlots } from '../model/TimeSlots';
import { Categories } from '../model/Categories';
import { Accessories } from '../model/Accessory';
import { CylinderSizes } from '../model/CylinderSizes';
import { DeliveryLocations } from '../model/deliveryLocations';

interface IUpdateCart {
  qty?: number;
}

export const getCart = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
  } = req;

  const service = new GetCart();
  const result = await service.execute({
    userId,
    isOrder: false,
  });

  res.status(200).json({ cart: result });
};

export const createCartValidation = {
  body: Joi.object({
    qty: Joi.number().integer().min(1).required(),
    scheduleDate: Joi.date().greater(new Date()).required(),
    lekageFee: Joi.number().min(0).optional(),
    zipcodeId: Joi.number().integer().min(1).required(),
    productId: Joi.number().integer().min(1).optional(),
    categoryId: Joi.number().integer().min(1).optional(),
    timeslotId: Joi.number().integer().min(1).required(),
    locationId: Joi.number().integer().min(1).optional(),
    accessoryId: Joi.number().integer().min(1).optional(),
    cylinderSizeId: Joi.number().integer().min(1).optional(),
    orderType: Joi.number().integer().min(1).max(2).required(),
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
// {
//   scheduleDate: Joi.date().required(),
//   qty: Joi.number().integer().min(1).required(),
//   lekageFee: Joi.when('accessoryId', {
//     is: Joi.exist(),
//     then: Joi.forbidden(),
//     otherwise: Joi.number().min(0).required(),
//   }),
//   timeslotId: Joi.number().integer().min(1).required(),
//   locationId: Joi.number().integer().min(1).required(),
//   zipcodeId: Joi.number().integer().min(1).required(),
//   productId: Joi.when('accessoryId', {
//     is: Joi.exist(),
//     then: Joi.forbidden(),
//     otherwise: Joi.number().integer().min(1).required(),
//   }),
//   categoryId: Joi.number().integer().min(1).optional(),
//   accessoryId: Joi.when('productId', {
//     is: Joi.exist(),
//     then: Joi.forbidden(),
//     otherwise: Joi.number().integer().min(1).required(),
//   }),
//   cylinderSizeId: Joi.when('accessoryId', {
//     is: Joi.exist(),
//     then: Joi.forbidden(),
//     otherwise: Joi.number().integer().min(1).required(),
//   }),
//   orderType: Joi.number().integer().min(1).max(2).required(),
//   vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
// }
export const createCart = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: {
      qty,
      orderType,
      scheduleDate,
      productId,
      categoryId,
      zipcodeId,
      timeslotId,
      accessoryId,
      cylinderSizeId,
      lekageFee,
      locationId,
      vendorId,
    },
  } = req;

  const cartRepository = getCustomRepository(CartRepository);
  let cart = cartRepository.create({
    qty,
    orderType,
    scheduleDate,
    lekageFee,
    user,
    updatedBy: user?.id,
    createdBy: user?.id,
    vendor: vendorId && (await getManager().getRepository(Users).findOneOrFail(vendorId)),
    product: productId && (await getManager().getRepository(Products).findOne(productId)),
    zipcode: zipcodeId && (await getManager().getRepository(ZipCodes).findOneOrFail(zipcodeId)),
    location:
      locationId && (await getManager().getRepository(DeliveryLocations).findOne(locationId)),
    category: categoryId && (await getManager().getRepository(Categories).findOne(categoryId)),
    timeslot: timeslotId && (await getManager().getRepository(TimeSlots).findOneOrFail(timeslotId)),
    accessory: accessoryId && (await getManager().getRepository(Accessories).findOne(accessoryId)),
    cylindersize:
      cylinderSizeId && (await getManager().getRepository(CylinderSizes).findOne(cylinderSizeId)),
  });

  cart = await cartRepository.save(cart);
  if (accessoryId) {
    res.status(201).json({ ...cart, categoryType: 3 });
  } else {
    res.status(201).json(cart);
  }
};

export const updateCartValidation = {
  body: Joi.object({
    qty: Joi.number().min(1).required(),
  }),
  params: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),
};
export const updateCart = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: { qty },
    params: { id },
  } = req;

  const cartRepository = getCustomRepository(CartRepository);
  const cartToUpdate: IUpdateCart = {};

  if (qty !== undefined) cartToUpdate.qty = qty;
  await cartRepository.update(id, cartToUpdate);

  res.sendStatus(204);
};

export const removeCartValidation = {
  params: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),
};
export const removeCart = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(Cart, { id }, { updatedBy: userId });
    await em.softDelete(Cart, id);
  });

  res.sendStatus(204);
};
