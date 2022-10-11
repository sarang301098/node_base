import { getCustomRepository } from 'typeorm';
import { UsersRepository } from './../repository/Users';
import config from '../config';
import { Request, Response } from 'express';
import { URLSearchParams } from 'url';
import { BadRequestError } from '../error';
import Stripe from 'stripe';
import { isAccessToken, verifyToken } from '../service/token';
import { Token } from '../constants';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

export const getAuthLink = () => async (req: Request, res: Response): Promise<void> => {
  const args = new URLSearchParams({ client_id: config.STRIPE_CLIENT_ID, state: req.token });

  const url = `${config.STRIPE_AUTH_URL}?${args.toString()}`;

  res.send({ url });
};

export const createAcoount = () => async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query;

  if (!code || !state) throw new BadRequestError('code or token is not present');

  try {
    const accountDetails = await stripe.oauth.token({
      grant_type: 'authorization_code',

      code: code as string,
    });

    const decoded = await verifyToken(state as string, Token.ACCESS);

    if (!isAccessToken(decoded)) {
      throw new BadRequestError('Provided token is not valid access token', 'INVALID_ACCESS_TOKEN');
    }

    const { sub } = decoded;

    const usersRepository = getCustomRepository(UsersRepository);

    await usersRepository.update(sub, { stripeAccountId: accountDetails.stripe_user_id });

    res.send({ message: 'account created successfully.' });
  } catch (error) {
    throw new Error('Invalid code.');
  }
};
