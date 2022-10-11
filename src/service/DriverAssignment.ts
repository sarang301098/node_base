import { getCustomRepository, getManager } from 'typeorm';
import { OrderStatus } from '../constants';
import { DriverDetails } from '../model/DriverDetails';
import { OrderDetails } from '../model/OrderDetails';
import { VendorDetails } from '../model/VendorDetails';
import { OrderDetailsRepository } from '../repository/OrdersDetail';
import * as momentTimeZone from 'moment-timezone';
import logger from './log';

export class DriverAssignment {
  private static instance: DriverAssignment;
  constructor() {
    if (DriverAssignment.instance instanceof DriverAssignment) {
      return DriverAssignment.instance;
    }
    DriverAssignment.instance = this;
  }

  public async execute(): Promise<void> {
    try {
      const todaysOrderDetails = await this.getTodaysOrder();

      const freelanceDriver = await this.getFreelanceDriver();

      for (let i = 0; i < todaysOrderDetails?.length; i++) {
        let vendorsDeriver = await this.getVendorsDriver(todaysOrderDetails[i]?.vendorId);

        if (!vendorsDeriver && !vendorsDeriver?.drivers) {
          vendorsDeriver = {
            drivers: [],
          } as VendorDetails;
        }

        const totalDrivers = [...vendorsDeriver.drivers, ...freelanceDriver];

        for (let j = 0; j < totalDrivers?.length; j++) {
          const avaliableZipCode = totalDrivers[j].zipcodeIds.map((num) => Number(num));
          if (
            totalDrivers[j]?.zipcodeIds &&
            totalDrivers[j]?.zipcodeIds?.length > 0 &&
            avaliableZipCode.includes(todaysOrderDetails[i]?.zipcodeId) &&
            totalDrivers[j]?.orderType === todaysOrderDetails[i]?.orderType
          ) {
            const assignTotalOrderToDriver = await this.getTodaysOrderAssignCount(
              totalDrivers[j]?.user?.id,
            );

            if (assignTotalOrderToDriver < totalDrivers[j].orderCapacity) {
              const orderDetailsRepo = getCustomRepository(OrderDetailsRepository);
              await orderDetailsRepo.save({
                ...todaysOrderDetails[i],
                driver: totalDrivers[j].user,
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      logger.error('Error in driver assignment', e);
    }
  }

  private getTodaysOrder() {
    return getManager()
      .createQueryBuilder(OrderDetails, 'orderDetails')
      .andWhere(
        'orderDetails.status IN (:...status) AND orderDetails.schedule_date >= :startAt AND orderDetails.schedule_date <= :endAt AND orderDetails.driver_id is NULL',
        {
          startAt: momentTimeZone.tz(new Date(), 'America/New_York').startOf('day').format(),
          endAt: momentTimeZone.tz(new Date(), 'America/New_York').endOf('day').format(),
          status: [
            OrderStatus.PENDING,
            OrderStatus.REFILLED,
            OrderStatus.EMERGENCY_ORDER,
            OrderStatus.RESCHEDULED,
          ],
        },
      )
      .getMany();
  }

  private getFreelanceDriver() {
    return getManager()
      .createQueryBuilder(DriverDetails, 'driverDetails')
      .andWhere(
        'driverDetails.is_online = :isOnline AND driverDetails.is_approved = :isApproved AND driverDetails.is_suspended = :isSuspended AND driverDetails.vendor is NULL',
        {
          isOnline: true,
          isApproved: true,
          isSuspended: false,
        },
      )
      .leftJoinAndSelect('driverDetails.user', 'user')
      .getMany();
  }

  private getTodaysOrderAssignCount(driverId: string) {
    return getManager()
      .createQueryBuilder(OrderDetails, 'orderDetails')
      .andWhere(
        'orderDetails.status IN (:...status) AND orderDetails.schedule_date >= :startAt AND orderDetails.schedule_date <= :endAt AND orderDetails.driver_id = :driverId',
        {
          startAt: momentTimeZone.tz(new Date(), 'America/New_York').startOf('day').format(),
          endAt: momentTimeZone.tz(new Date(), 'America/New_York').endOf('day').format(),
          status: [
            OrderStatus.PENDING,
            OrderStatus.REFILLED,
            OrderStatus.EMERGENCY_ORDER,
            OrderStatus.RESCHEDULED,
          ],
          driverId: driverId,
        },
      )
      .getCount();
  }

  private getVendorsDriver(vendorId: string) {
    return getManager()
      .createQueryBuilder(VendorDetails, 'vendorDetails')
      .leftJoinAndSelect('vendorDetails.user', 'vendor')
      .andWhere('vendor.id = :vendorId', { vendorId: vendorId })
      .leftJoinAndSelect('vendorDetails.drivers', 'drivers')
      .leftJoinAndSelect('drivers.user', 'user')
      .andWhere(
        'drivers.is_online = :isOnline AND drivers.is_approved = :isApproved AND drivers.is_suspended = :isSuspended',
        {
          isOnline: true,
          isApproved: true,
          isSuspended: false,
        },
      )
      .getOne();
  }
}
