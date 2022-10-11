import { getRepository } from 'typeorm';
import { Request, Response } from 'express';
import Stripe from 'stripe';

import config from '../config';

import { Orders } from '../model/Orders';
import { UserSubscription } from '../model/UserSubscription';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });
const endpointSecret = config.STRIPE_WEBHOOK_ENDPOINT_SECRET;

// TODO: Will use for the later integration.
// const stripePaymentIntentEvents = [
//   'payment_intent.amount_capturable_updated',
//   'payment_intent.canceled',
//   'payment_intent.created',
//   'payment_intent.payment_failed',
//   'payment_intent.processing',
//   'payment_intent.requires_action',
//   'payment_intent.succeeded',
// ];

export const webhook = () => async (req: Request, res: Response): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sig: any = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err?.message}`);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paymentIntent: any;

  if (event.type === 'payment_intent.succeeded') {
    paymentIntent = event.data.object;
    if (paymentIntent && paymentIntent?.metadata) {
      if (paymentIntent?.metadata?.is_order) {
        const { order_id: orderId } = paymentIntent?.metadata || {};
        const ordersRepo = getRepository(Orders);
        await ordersRepo.update(orderId, {
          isPaid: true,
          stripePaymentIntentId: paymentIntent?.id,
          invoicedReceiptUrl:
            paymentIntent?.charges?.data && paymentIntent?.charges?.data[0].receipt_url,
        });
      } else if (paymentIntent?.metadata?.is_plan_purchase) {
        const { user_subscription_id: userSubscriptionId } = paymentIntent?.metadata || {};
        const userSubscriptionRepo = getRepository(UserSubscription);
        await userSubscriptionRepo.update(userSubscriptionId, { status: 2, isActive: true });
      }
    }
  }

  res.send(paymentIntent);
};
