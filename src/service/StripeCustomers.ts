import Stripe from 'stripe';

import config from '../config';
import { Actions } from '../constants';
import logger from '../service/log';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

interface Request {
  userId: string;
  action: Actions;
  email?: string;
  name?: string;
  limit?: number;
  isReadById?: boolean;
  stripeCustomerId?: string;
}

interface Response {
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customer?: any;
  stripeCustomerId?: string;
}

class StripeCustomersService {
  private static instance: StripeCustomersService;

  constructor() {
    if (StripeCustomersService.instance instanceof StripeCustomersService) {
      return StripeCustomersService.instance;
    }
    StripeCustomersService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const action: Actions = request?.action;
    let response: Response = {};

    switch (action) {
      case Actions.CREATE:
        response = await this.createCustomer(request);
        break;
      case Actions.UPDATE:
        response = await this.UpdateCustomer(request);
        break;
      case Actions.READ:
        response = await this.ReadCustomer(request);
        break;
      case Actions.LIST:
        response = await this.ListCustomer(request);
        break;
      case Actions.DELETE:
        response = await this.DeleteCustomer(request);
        break;
      default:
        logger.info('Not match any actions for the Stripe Customers');
        response = {
          message: 'ACTION_NOT_FOUND',
        };
        break;
    }
    return response;
  }

  private async createCustomer(request: Request) {
    const params: Stripe.CustomerCreateParams = {
      description: request?.userId,
      email: request?.email,
      name: request?.name,
      metadata: {
        userId: request?.userId,
      },
    };
    const customer: Stripe.Customer = await stripe.customers.create(params);
    const response: Response = {
      stripeCustomerId: customer?.id,
      message: 'CUSTOMER_CREATE_SUCCESS',
    };

    return response;
  }

  private async UpdateCustomer(request: Request) {
    const params: Stripe.CustomerUpdateParams = {
      description: request?.userId,
      email: request?.email,
    };

    const customer: Stripe.Customer = await stripe.customers.update(
      request?.stripeCustomerId || '',
      params,
    );
    const response: Response = {
      stripeCustomerId: customer?.id,
      message: 'CUSTOMER_UPDATE_SUCCESS',
    };

    return response;
  }

  private async DeleteCustomer(request: Request) {
    const customer = await stripe.customers.del(request?.stripeCustomerId || '');

    let response: Response = { message: 'CUSTOMER_DELETE_ERROR' };
    if (customer && customer?.deleted) {
      response = {
        stripeCustomerId: customer?.id,
        message: 'CUSTOMER_DELETE_SUCCESS',
      };
    }

    return response;
  }

  private async ReadCustomer(request: Request) {
    const customer = await stripe.customers.retrieve(request?.stripeCustomerId || '');

    const response: Response = {
      message: 'CUSTOMER_DELETE_SUCCESS',
      customer,
    };

    return response;
  }

  private async ListCustomer(request: Request) {
    const customer = await stripe.customers.list({
      limit: request?.limit,
    });

    let response: Response = { message: 'CUSTOMER_DELETE_ERROR' };
    response = {
      message: 'CUSTOMER_LIST_GET_SUCCESS',
      customer,
    };

    return response;
  }
}

export default StripeCustomersService;
