import { Request, Response } from 'express';
import { Joi } from 'express-validation';

import StripeCardsService from '../service/StripeCards';

import { Actions } from '../constants';

export const getAllValidation = {
  query: Joi.object({
    limit: Joi.number().max(100).allow(null).default(3),
    object: Joi.string().allow(null).default('card'),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { limit, object },
  } = req;

  const service = new StripeCardsService();
  const result = await service.execute({
    limit: Number(limit),
    object: object?.toString() || 'card',
    stripeCustomerId: user?.stripeCustomerId || '',
    action: Actions.LIST,
  });

  res.status(200).json({ cards: result?.sources?.data });
};

export const createUsersCardValidation = {
  body: Joi.object({
    cardNumber: Joi.string().max(25).required(),
    expMonth: Joi.string().max(5).required(),
    expYear: Joi.string().max(5).required(),
    cvc: Joi.string().max(5).required(),
    name: Joi.string().max(50).required(),
    isDefault: Joi.boolean().required().default(true),
  }),
};
export const createUsersCard = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { cardNumber, expMonth, expYear, cvc, name },
  } = req;

  const service = new StripeCardsService();

  // TODO: check the card is available or not.
  // const existingCard = await service.execute({
  //   object: 'card',
  //   stripeCustomerId: user?.stripeCustomerId || '',
  //   action: Actions.LIST,
  // });

  // const {
  //   sources: { data: userCards },
  // } = existingCard;

  // if (existingCard && userCards && userCards.length) {
  // for (let index = 0; index < userCards.length; index++) {

  // }
  // }

  const result = await service.execute({
    cvc,
    name,
    expYear,
    expMonth,
    cardNumber,
    userId: user?.id,
    action: Actions.CREATE,
    stripeCustomerId: user?.stripeCustomerId || '',
  });

  res.status(200).json(result);
};

export const updateUsersCardValidation = {
  body: Joi.object({
    expMonth: Joi.string().required(),
    expYear: Joi.string().required(),
    name: Joi.string().required(),
  }),
  params: Joi.object({ id: Joi.string().required() }),
};
export const updateUsersCard = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { expMonth, expYear, name },
    params: { id },
  } = req;

  const service = new StripeCardsService();
  const result = await service.execute({
    name,
    expYear,
    expMonth,
    stripeCardId: id,
    userId: user?.id,
    action: Actions.UPDATE,
    stripeCustomerId: user?.stripeCustomerId || '',
  });

  res.status(200).json(result);
};

export const deleteUsersCardValidation = {
  params: Joi.object({ id: Joi.string().required() }),
};
export const deleteUsersCard = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    params: { id },
  } = req;

  const service = new StripeCardsService();
  const result = await service.execute({
    stripeCardId: id,
    action: Actions.DELETE,
    stripeCustomerId: user?.stripeCustomerId || '',
  });

  res.status(204).json(result);
};

export const getUsersCardByIdValidation = {
  params: Joi.object({ id: Joi.string().required() }),
};
export const getUsersCardById = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    params: { id },
  } = req;

  const service = new StripeCardsService();
  const result = await service.execute({
    stripeCustomerId: user?.stripeCustomerId || '',
    stripeCardId: id,
    action: Actions.READ,
  });

  res.status(200).json(result);
};
