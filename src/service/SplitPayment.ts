import Stripe from 'stripe';
import config from '../config';

const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

export interface SplitPayment {
  amount: number;

  destination: string;
}

export class StripeSplitPayment {
  private static instance: StripeSplitPayment;

  constructor() {
    if (StripeSplitPayment.instance instanceof StripeSplitPayment) {
      return StripeSplitPayment.instance;
    }

    StripeSplitPayment.instance = this;
  }

  public splitPayment(splitPaymentData: SplitPayment): Promise<Stripe.Response<Stripe.Transfer>> {
    const { amount, destination } = splitPaymentData;

    return stripe.transfers.create({
      amount: amount * 100,

      currency: 'usd',

      destination: destination,
    });
  }

  public splitPaymentRefund(transferId: string): Promise<Stripe.Response<Stripe.TransferReversal>> {
    return stripe.transfers.createReversal(transferId);
  }
}
