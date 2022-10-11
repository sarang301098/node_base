import Stripe from 'stripe';

import config from '../config';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

interface Request {
  email?: string;
  amount?: number;
  userId?: string;
  orderId?: number;
  isOrder: boolean;
  currency: string;
  confirm?: boolean;
  stripeCardId?: string;
  orderDetailIds?: Array<string>;
  stripeCustomerId?: string;
}

interface Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PaymentIntent?: any;
  message?: string;
}

class StripeOrderPaymentService {
  private static instance: StripeOrderPaymentService;

  constructor() {
    if (StripeOrderPaymentService.instance instanceof StripeOrderPaymentService) {
      return StripeOrderPaymentService.instance;
    }
    StripeOrderPaymentService.instance = this;
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
      amount: request?.amount ? request?.amount * 100 : 0,
      currency: 'usd', // TODO: update as a usd.
      customer: request?.stripeCustomerId,
      payment_method: request?.stripeCardId,
      confirm: request?.confirm,
      setup_future_usage: 'on_session',
      receipt_email: request?.email || 'test@gmail.com',
      metadata: {
        user_id: request?.userId || '',
        order_id: request?.orderId || '',
        order_detail_ids: (request?.orderDetailIds || []).join(', ') || '',
        is_order: Number(request?.isOrder),
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(params);

    return paymentIntent;
  }

  public refundPayment(
    paymentIntentId: string,
    amount: number,
  ): Promise<Stripe.Response<Stripe.Refund>> {
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount * 100,
    });
  }

  public getPaymentInfo(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>> {
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

export default StripeOrderPaymentService;
