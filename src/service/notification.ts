import admin from 'firebase-admin';

import logger from './log';
import config from '../config';

interface Request {
  fromId?: string;
  toIds?: Array<string | number>;
  tokens: Array<string>;
  title?: string;
  isAdmin?: boolean;
  description?: string;
  notificationType?: number;
}

class SendPushNotificationService {
  private static instance: SendPushNotificationService;

  constructor() {
    if (SendPushNotificationService.instance instanceof SendPushNotificationService) {
      return SendPushNotificationService.instance;
    }
    SendPushNotificationService.instance = this;
  }

  public async execute(request: Request): Promise<void> {
    this.sendPushNotification(request);
  }

  private async sendPushNotification(request: Request): Promise<void> {
    const option = {
      priority: 'high',
      timeToLive: 60 * 60 * 24,
    };

    const payload = {
      notification: {
        title: request?.title,
        body: request?.description,
      },
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.FIREBASE_PROJECT_ID,
          clientEmail: config.FIREBASE_CLIENT_EMAIL,
          privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    try {
      admin.messaging().sendToDevice(request?.tokens, payload, option);
    } catch (error) {
      logger.error(`Error while sending push`);
    }
  }

  // TODO:- This part any api call format:-
  // let title = "Account Deposit";
  // let description = "A deposit to your savings account has just cleared.";
  // let fromId = '123';
  // let notificationType = 1;
  // let toId = ['LJMgVljTwiBOEUjnAoSCV:APA91bHjPU62R-EU2gT_Zhc5Bcv0PKjE77HY7IjvhIifloVxUkZ4HVyhnwkLzOrXFAl6LbXZxGoyjw8gQg8LWn3kSeDNFpI9D-IlUyFHzJUvXmWE4I3uaDoLz79NW8BLEAUWV4diXZ-g'];
  // let isAdmin=false;

  // sendPushNotification(fromId, toId, title,isAdmin, description, notificationType);
}

export default SendPushNotificationService;
