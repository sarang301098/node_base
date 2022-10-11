import Stripe from 'stripe';

import config from '../config';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

interface Request {
  amount: number;
  userId: string;
  currency: string;
  confirm?: boolean;
  stripeCardId: string;
  isPlanPurchase: boolean;
  membershipPlanId: number;
  stripeCustomerId: string;
  userSubscriptionId: number;
  membershipPlanPricesId: number;
}

interface Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PaymentIntent?: any;
  message?: string;
}

class PurchasePlanService {
  private static instance: PurchasePlanService;

  constructor() {
    if (PurchasePlanService.instance instanceof PurchasePlanService) {
      return PurchasePlanService.instance;
    }
    PurchasePlanService.instance = this;
  }

  public async execute(request: Request): Promise<Response> {
    const PaymentIntent = await this.createPaymentIntent(request);

    const response: Response = {
      PaymentIntent,
      message: 'PAYMENTINTENT_CREATE_SUCCESS',
    };
    return response;
  }

  public async createPaymentIntent(request: Request): Promise<Stripe.PaymentIntent> {
    const params: Stripe.PaymentIntentCreateParams = {
      payment_method_types: ['card'],
      amount: request?.amount * 100,
      currency: 'usd', // TODO: update as a usd.
      customer: request?.stripeCustomerId,
      payment_method: request?.stripeCardId,
      confirm: request?.confirm,
      setup_future_usage: 'on_session',
      metadata: {
        user_id: request?.userId,
        membership_plan_id: request?.membershipPlanId,
        membership_plan_prices_id: request?.membershipPlanPricesId,
        is_plan_purchase: Number(request?.isPlanPurchase),
        user_subscription_id: request?.userSubscriptionId,
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(params);

    return paymentIntent;
  }
}

export default PurchasePlanService;
