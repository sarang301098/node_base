import Stripe from 'stripe';

import config from '../config';
import { Actions } from '../constants';
import { BadRequestError } from '../error';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

interface Request {
  userId?: string;
  name?: string;
  cardNumber?: string;
  expMonth?: string;
  expYear?: string;
  cvc?: string;
  action: Actions;
  limit?: number;
  isReadById?: boolean;
  stripeCustomerId?: string;
  stripeCardId?: string;
  object?: string;
}

interface Response {
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sources?: any;
  stripeCardId?: string;
}

class StripeCardsService {
  private static instance: StripeCardsService;

  constructor() {
    if (StripeCardsService.instance instanceof StripeCardsService) {
      return StripeCardsService.instance;
    }
    StripeCardsService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const action: Actions = request?.action;
    let response: Response = {};

    switch (action) {
      case Actions.CREATE:
        response = await this.createCard(request);
        break;
      case Actions.UPDATE:
        response = await this.UpdateCard(request);
        break;
      case Actions.READ:
        response = await this.ReadCard(request);
        break;
      case Actions.LIST:
        response = await this.ListCard(request);
        break;
      case Actions.DELETE:
        response = await this.DeleteCard(request);
        break;
      default:
        response = { message: 'Action of the card is not available' };
        break;
    }
    return response || {};
  }

  private async createCard(request: Request) {
    if (!(request && request.stripeCustomerId)) {
      throw new BadRequestError('Stripe Customer is not available', 'CUSTOMER_NOT_AVAILABLE');
    }
    const tokenParams: Stripe.TokenCreateParams = {
      card: {
        name: request?.name,
        number: request?.cardNumber || '',
        exp_month: request?.expMonth || '',
        exp_year: request?.expYear || '',
        cvc: request?.cvc,
      },
    };

    const token: Stripe.Token = await stripe.tokens.create(tokenParams);

    if (!token) {
      throw new BadRequestError('Stripe Token is not created', 'TOKEN_CREATE_ERROR');
    }

    const sources = await stripe.customers.createSource(request?.stripeCustomerId || '', {
      source: token?.id,
      metadata: {
        userId: request?.userId || '',
        customerId: request?.stripeCustomerId || '',
      },
    });

    const response: Response = {
      message: 'SOURCE_CREATE_SUCCESS',
      sources,
    };
    return response;
  }

  private async UpdateCard(request: Request) {
    if (!(request && request.stripeCustomerId && request.stripeCardId)) {
      throw new BadRequestError('Cannot update card', 'CARD_UPDATE_ERROR');
    }

    const sources = await stripe.customers.updateSource(
      request?.stripeCustomerId || '',
      request?.stripeCardId || '',
      {
        name: request?.name,
        exp_month: request?.expMonth || '',
        exp_year: request?.expYear || '',
        metadata: {
          userId: request?.userId || '',
          customerId: request?.stripeCustomerId || '',
        },
      },
    );

    let response: Response = { message: 'SOURCE_UPDATE_ERROR' };
    if (sources) {
      response = {
        message: 'SOURCE_UPDATE_SUCCESS',
        sources,
      };
    }
    return response;
  }

  private async DeleteCard(request: Request) {
    if (!(request && request.stripeCustomerId && request.stripeCardId)) {
      throw new BadRequestError('Cannot delete card', 'CARD_DELETE_ERROR');
    }
    const card = await stripe.customers.deleteSource(
      request?.stripeCustomerId || '',
      request?.stripeCardId || '',
    );

    let response: Response = { message: 'CARD_DELETE_ERROR' };
    if (card) {
      response = {
        stripeCardId: card?.id,
        message: 'CARD_DELETE_SUCCESS',
      };
    }

    return response;
  }

  private async ReadCard(request: Request) {
    if (!(request && request.stripeCustomerId && request.stripeCardId)) {
      throw new BadRequestError(
        'Cannot retrive card with in appropriate data',
        'CARD_RETRIVE_ERROR',
      );
    }
    const sources = await stripe.customers.retrieveSource(
      request?.stripeCustomerId || '',
      request?.stripeCardId || '',
    );

    const response: Response = {
      message: 'CUSTOMER_DELETE_SUCCESS',
      sources,
    };

    return response;
  }

  private async ListCard(request: Request) {
    if (!(request && request.stripeCustomerId)) {
      throw new BadRequestError(
        'Cannot retrive card list with in appropriate data',
        'CARD_LIST_RETRIV_ERROR',
      );
    }

    const sources = await stripe.customers.listSources(request?.stripeCustomerId, {
      limit: 10, // TODO: set limit by request?.limit
      object: request?.object || 'card',
    });

    let response: Response = { message: 'CARD_DELETE_ERROR' };
    if (sources) {
      response = {
        message: 'CARD_LIST_GET_SUCCESS',
        sources,
      };
    }

    return response;
  }
}

export default StripeCardsService;
