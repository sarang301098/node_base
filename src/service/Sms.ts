import twilio from 'twilio';
import logger from './log';

import config from '../config';
export interface SmsBody {
  to: string;
  mediaUrl?: Array<string>;
  body?: string;
}

const accountSid = config.TWILIO_ACCOUNT_SID;
const authToken = config.TWILIO_AUTH_TOKEN;
const phoneNumber = config.TWILIO_PHONE_NUMBER;

export class SmsService {
  private static instance: SmsService;

  constructor() {
    if (SmsService.instance instanceof SmsService) {
      return SmsService.instance;
    }
    SmsService.instance = this;
  }

  private createClient(to: string, body?: string, mediaUrl?: Array<string>) {
    const smsClient = {
      from: `${phoneNumber}`,
      to,
      body,
      mediaUrl,
    };

    return smsClient;
  }

  async send({ to, body, mediaUrl }: SmsBody): Promise<unknown> {
    const client = twilio(accountSid, authToken);
    const smsClient = this.createClient(to, body, mediaUrl);

    if (!client && !smsClient) {
      logger.error(`client is not present to send sms.`);
      throw new Error(`client is not present to send sms.`);
    }

    return client.messages.create(smsClient);
  }
}
