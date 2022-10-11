import { getRepository, getCustomRepository, getManager, Not, Brackets } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import moment from 'moment';
import * as momentTimeZone from 'moment-timezone';

import { BadRequestError } from '../error';
import { TimeSlotsRepository } from '../repository/timeSlots';

import { Users } from '../model/Users';
import { TimeSlots } from '../model/TimeSlots';
import { GovernmentHolidays } from '../model/GovernmentHolidays';

import { PropaneUserType } from '../constants';
import { OrderDetails } from '../model/OrderDetails';

type createTimeSlot = {
  startTime: string;
  endTime: string;
};

export const getTimeSlotsValidation = {
  query: Joi.object({
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(40).default(10),
    isFilters: Joi.boolean().default(true).optional(),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, isFilters },
  } = req;

  const timeSlotsRepository = getRepository(TimeSlots);
  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager().createQueryBuilder(TimeSlots, 'timeSlot').offset(offset).limit(limit);

  if (search && search !== '') {
    query.orWhere('timeSlot.startTime like :startTime', { startTime: '%' + search + '%' });
    query.orWhere('timeSlot.endTime like :endTime', { endTime: '%' + search + '%' });
  }

  const [timeSlots, count] = isFilters
    ? await query.getManyAndCount()
    : await timeSlotsRepository.findAndCount({ select: ['id', 'startTime', 'endTime'] });

  res.status(200).json({ count, timeSlots });
};

export const getProductTimeSlotsValidation = {
  query: Joi.object({
    vendorIds: Joi.array()
      .items(
        Joi.alternatives(Joi.number().integer().min(0).required(), Joi.string().min(1).required()),
      )
      .allow(null),
    date: Joi.date().greater(moment().startOf('day').subtract(1, 'd').toDate()).required(),
  }),
};
export const getProductTimeSlots = () => async (req: Request, res: Response): Promise<any> => {
  let {
    query: { vendorIds, date },
  } = req;

  date = momentTimeZone.tz(date, 'America/New_York').format();

  // TODO: Remove all any from the API.
  // random vendor selectioin.
  const availableVendors = vendorIds as Array<string>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weekDay = momentTimeZone.tz(date, 'America/New_York').day();

  let curr = 0;
  if (availableVendors?.length > 0)
    while (availableVendors?.length > curr) {
      // check holiday
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const start = momentTimeZone.tz(date, 'America/New_York').startOf('day').format();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const end = momentTimeZone.tz(date, 'America/New_York').endOf('day').format();

      const vendorsHoliday = await getManager()
        .createQueryBuilder(GovernmentHolidays, 'governmentHoliday')
        .where('governmentHoliday.date >= :start AND governmentHoliday.date <= :end', {
          start,
          end,
        })
        .andWhere('FIND_IN_SET(:selectedVendorId, governmentHoliday.vendorIds)', {
          selectedVendorId: availableVendors[curr],
        })
        .getOne();

      if (!vendorsHoliday) {
        // get vendorDetails
        const usersRepository = getRepository(Users);
        const user = await usersRepository.findOne({
          where: { id: availableVendors[curr], userType: PropaneUserType.VENDOR },
          relations: ['vendor'],
        });

        const query = getManager()
          .createQueryBuilder(TimeSlots, 'timeSlots')
          .where(
            new Brackets((qb) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (
                momentTimeZone.tz(date, 'America/New_York').day() ===
                momentTimeZone.tz(new Date(), 'America/New_York').day()
              ) {
                return qb
                  .orWhere('timeSlots.startTime >= :currtime AND timeSlots.endTime >= :currtime', {
                    currtime: momentTimeZone.tz(new Date(), 'America/New_York').format('HH:mm'),
                  })
                  .orWhere('timeSlots.startTime <= :currtime AND timeSlots.endTime >= :currtime', {
                    currtime: momentTimeZone.tz(new Date(), 'America/New_York').format('HH:mm'),
                  });
              } else {
                return qb;
              }
            }),
          )
          .innerJoinAndSelect(
            'timeSlots.vendorSchedules',
            'vendorSchedules',
            'vendorSchedules.vendor_id = :selectedVendorId AND vendorSchedules.is_checked = true AND vendorSchedules.day = :weekDay AND vendorSchedules.maxAcceptOrderLimit != 0',
            { selectedVendorId: user?.vendor?.id, weekDay },
          );

        const [timeSlot, count] = await query.getManyAndCount();
        const timeslotByVendorMaxOrderAcceptance = new Map();
        const timeSlotFilter = [];
        if (timeSlot && timeSlot.length) {
          const query = await getManager()
            .createQueryBuilder(OrderDetails, 'orderDetails')
            .where(
              'orderDetails.vendor_id = :venderId AND schedule_date <= :end AND schedule_date >= :start',
              {
                venderId: availableVendors[curr],
                start,
                end,
              },
            )
            .getMany();
          for (let index = 0; index < timeSlot.length; index++) {
            if (
              calculateOrderBySlotAndDay(
                query,
                timeSlot[index]?.startTime.toString(),
                timeSlot[index]?.endTime.toString(),
              ) < timeSlot[index]?.vendorSchedules[0]?.maxAcceptOrderLimit
            ) {
              timeSlotFilter.push(timeSlot[index]);
            }

            timeslotByVendorMaxOrderAcceptance.set(
              timeSlot[index]?.id,
              (timeSlot[index]?.vendorSchedules || []).map((schedule) => {
                return { id: schedule?.id, maxAcceptOrderLimit: schedule?.maxAcceptOrderLimit };
              }),
            );
          }
        }
        if (count > 0 && timeSlotFilter.length > 0) {
          return res
            .status(200)
            .json({ timeSlot: timeSlotFilter, count, selectedVendorId: availableVendors[curr] });
        }
      }
      curr++;
    }

  res.status(200).json({ timeSlot: [], count: 0, selectedVendorId: '' });
};

const calculateOrderBySlotAndDay = (
  orderDetails: OrderDetails[],
  startTime: string,
  endTime: string,
): number => {
  let count = 0;
  for (let i = 0; i < orderDetails.length; i++) {
    if (
      orderDetails[i].startTime.toString() === startTime &&
      orderDetails[i].endTime.toString() === endTime
    ) {
      count++;
    }
  }
  return count;
};

export const createTimeSlotsManyValidation = {
  body: Joi.object({
    timeSlots: Joi.array().items(
      Joi.object({
        startTime: Joi.alternatives(Joi.date().required(), Joi.string().min(1).required()),
        endTime: Joi.alternatives(Joi.date().required(), Joi.string().min(1).required()),
      }),
    ),
  }),
};
export const createTimeSlotsMany = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { timeSlots },
  } = req;

  const timeSlotsRepository = getRepository(TimeSlots);
  const createdTimeSlots: TimeSlots[] = [];
  const availableTimeSlots: TimeSlots[] = [];

  for (let index = 0; index < timeSlots?.length; index++) {
    const timeSlot: createTimeSlot = timeSlots[index];
    let newTimeSlot = await timeSlotsRepository.findOne({ where: { ...timeSlot } });

    if (newTimeSlot) {
      availableTimeSlots.push(newTimeSlot);
    } else {
      newTimeSlot = timeSlotsRepository.create({
        ...timeSlot,
        createdBy: user?.id,
        updatedBy: user?.id,
      });
      newTimeSlot = await timeSlotsRepository.save(newTimeSlot);
      createdTimeSlots.push(newTimeSlot);
    }
  }

  res.status(200).json({ createdTimeSlots, availableTimeSlots });
};

export const updateTimeSlotValidation = {
  body: Joi.object({
    startTime: Joi.alternatives(Joi.date().required(), Joi.string().min(1).required()),
    endTime: Joi.alternatives(Joi.date().required(), Joi.string().min(1).required()),
  }),
};
export const updateTimeSlot = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { startTime, endTime },
    params: { id },
  } = req;

  const timeSlotsRepository = getCustomRepository(TimeSlotsRepository);
  await timeSlotsRepository.findByIdOrFail(id);
  const uniqSlot = await timeSlotsRepository.findOne({
    where: { id: Not(id), startTime, endTime },
  });
  if (uniqSlot) {
    throw new BadRequestError(
      `Timeslot is Already Available Please, create new or update with different Time Slots`,
      'TIMESLOT_ALREADY_AVAILABLE',
    );
  }

  let timeSlotToUpdate = await timeSlotsRepository.findByIdOrFail(id);
  timeSlotToUpdate = Object.assign({}, timeSlotToUpdate, {
    startTime,
    endTime,
    updatedBy: user?.id,
  });

  await timeSlotsRepository.save(timeSlotToUpdate);

  res.status(200).json(timeSlotToUpdate);
};

export const deleteTimeSlotValidation = {
  params: Joi.object({ id: Joi.number().required() }),
};
export const removeTimeSlot = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.update(TimeSlots, { id }, { updatedBy: userId });
    await em.softDelete(TimeSlots, id);
  });

  res.sendStatus(204);
};
