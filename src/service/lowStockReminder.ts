import logger from './log';
import { getManager } from 'typeorm';
import { MailService } from './Mail';
import { VendorStocks } from '../model/VendorStocks';
import { VendorDetails } from '../model/VendorDetails';
import SendPushNotificationService from './notification';

interface Request {
  userId?: string;
}
export class LowStockReminder {
  private static instace: LowStockReminder;
  constructor() {
    if (LowStockReminder.instace instanceof LowStockReminder) {
      return LowStockReminder.instace;
    }
    LowStockReminder.instace = this;
  }

  public async execute(request: Request): Promise<void> {
    const vendorDetailsReminder = await this.vendorDetailReminder();
    const vendorStockReminder = await this.vendorStockReminder();
    const notificationService = new SendPushNotificationService();

    for (let i = 0; i < vendorDetailsReminder.length; i++) {
      for (let j = 0; j <= vendorStockReminder.length; j++) {
        if (
          vendorDetailsReminder[i].user.id === request?.userId &&
          vendorDetailsReminder[i]?.user?.id === vendorStockReminder[j]?.vendor?.user?.id &&
          vendorDetailsReminder[i]?.lowStockReminder >= vendorStockReminder[j]?.remainingStock
        ) {
          try {
            notificationService.execute({
              title: 'Low Stock Reminder',
              description: `Your ${vendorStockReminder[j]?.category?.name} stock is low`,
              notificationType: 1,
              tokens: [vendorDetailsReminder[i]?.user?.token?.deviceId],
            });
            const mailService = new MailService();
            const mailBody = {
              to: vendorStockReminder[j]?.vendor?.user?.email,
              email: vendorStockReminder[j]?.vendor?.user?.email,
              subject: 'Low Stock Reminder',
              text: 'low_stock_reminder',
              fullname: vendorStockReminder[j]?.category?.name,
              qty: vendorStockReminder[j]?.remainingStock.toString(),
            };
            await mailService.send(mailBody);
          } catch (error) {
            logger.error('Error while send notification');
          }
        }
      }
    }
  }

  private vendorDetailReminder() {
    return getManager()
      .createQueryBuilder(VendorDetails, 'vendorDetails')
      .select([
        'vendorDetails.user',
        'vendorDetails.lowStockReminder',
        'vendorDetails.accessoryIds',
      ])
      .leftJoin('vendorDetails.user', 'vendor')
      .addSelect('vendor.id')
      .leftJoin('vendor.token', 'token')
      .addSelect('token.deviceId')
      .getMany();
  }

  private vendorStockReminder() {
    return getManager()
      .createQueryBuilder(VendorStocks, 'vendorStock')
      .select([
        'vendorStock.remainingStock',
        'vendorStock.category',
        'vendorStock.accessory',
        'vendorStock.product',
      ])
      .leftJoin('vendorStock.vendor', 'vendorDetail')
      .addSelect(['vendorDetail.id'])
      .leftJoin('vendorStock.accessory', 'accessory')
      .addSelect(['accessory.id', 'accessory.name'])
      .leftJoin('vendorStock.product', 'product')
      .addSelect(['product.id', 'product.name'])
      .leftJoin('vendorStock.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .leftJoinAndSelect('vendorDetail.user', 'user')
      .addSelect(['user.id', 'user.email'])
      .getMany();
  }
}
