import { getManager, getRepository } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { meanBy } from 'lodash';

import { BadRequestError } from '../error';

import { Users } from '../model/Users';
import { Ratings } from '../model/Ratings';
import { OrderDetails } from '../model/OrderDetails';

export const getAllValidation = {
  query: Joi.object({
    toUserId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { toUserId },
  } = req;

  const query = getManager()
    .createQueryBuilder(Ratings, 'rating')
    .leftJoin('rating.toUser', 'toUser')
    .where('toUser.id = :toUserId', { toUserId });

  const [ratings] = await query.getManyAndCount();
  const avgRating = meanBy(ratings, 'rating');

  const ratingTiers = (ratings || []).reduce(
    (previous: Record<string, number>, current: { rating: number }) => {
      return {
        ...previous,
        [current.rating]: (previous[current.rating] || 0) + 1,
      };
    },
    {},
  );

  res.status(200).json({ ratings, avgRating, ratingTiers });
};

export const createRatingValidation = {
  body: Joi.object({
    rating: Joi.number().max(5).required(),
    review: Joi.string().min(0).required(),
    orderId: Joi.number().integer().min(0).required(),
    toUserId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
export const createRating = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { rating, review, toUserId, orderId },
  } = req;

  const ratingsRepo = getRepository(Ratings);

  const existingRating = await ratingsRepo.findOne({
    where: {
      fromUser: user?.id,
      toUser: toUserId,
      orderDetail: orderId,
    },
  });

  if (existingRating) {
    throw new BadRequestError(
      `Ratings for the order: ${orderId} is already available`,
      'RATING_ALREADY_AVAILABLE',
    );
  }

  let ratings = ratingsRepo.create({
    rating,
    review,
    fromUser: user,
    toUser: toUserId && (await getManager().getRepository(Users).findOne(toUserId)),
    orderDetail: orderId && (await getManager().getRepository(OrderDetails).findOne(orderId)),
  });

  ratings = await ratingsRepo.save(ratings);
  res.status(201).json(ratings);
};
