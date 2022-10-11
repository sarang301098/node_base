import { Brackets, getCustomRepository, getManager, getRepository, In, Not } from 'typeorm';
import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { hash } from 'bcryptjs';

import { BadRequestError } from '../error';
import { MailService } from '../service/Mail';
import { generateRandomHex } from '../service/random';
import StripeCustomersService from '../service/StripeCustomers';

import { Users } from '../model/Users';
import { Documents } from '../model/Documents';
import { TimeSlots } from '../model/TimeSlots';
import { OrderDetails } from '../model/OrderDetails';
import { VendorDetails } from '../model/VendorDetails';
import { VendorSchedule } from '../model/VendorSchedule';
import { VendorBankDetails } from '../model/VendorBankDetails';
import { UserVerificationDetails } from '../model/UserVerificationDetails';
import { UserAddresses } from '../model/UserAddress';
import { VendorProductTiers } from '../model/VendorProductTiers';
import { VendorProducts } from '../model/VendorProducts';
import { VendorProductsPricing } from '../model/VendorProductPricing';

import { VendorBankDetailsRepository } from '../repository/VendorBankDetails';
import { PropaneUserType, Actions, OrderStatus } from '../constants';

export const getVendorsValidation = {
  query: Joi.object({
    search: Joi.string().max(50).allow(null).default(null),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(10),
    status: Joi.string().default('all'),
    zipcodeId: Joi.number().integer().default(null),
    startAt: Joi.date().default(null).optional(),
    endAt: Joi.date().default(null).optional(),
    sort: Joi.string().valid('ASC', 'DESC').default('ASC'),
    sortBy: Joi.string().default('fullName'),
    isFilters: Joi.boolean().default(true),
  }),
};
export const getAll = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { search, page, perPage, status, zipcodeId, sort, sortBy, startAt, endAt, isFilters },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .where('user.userType = :userType', { userType: PropaneUserType.VENDOR }) // static userType vendor
    .leftJoin('user.vendor', 'vendor')
    .addSelect([
      'vendor.id',
      'vendor.comissionFee',
      'vendor.leakageFee',
      'vendor.zipcodeIds',
      'vendor.status',
    ])
    .offset(offset)
    .limit(limit);

  if (search && search !== '') {
    query.andWhere('user.fullName like :fullName', { fullName: '%' + search + '%' });
  }

  if (zipcodeId) {
    query.andWhere('FIND_IN_SET(:zipcodeId, vendor.zipcodeIds)', { zipcodeId });
  }

  if (sort && sortBy) {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC');
  }

  if (status !== 'all') {
    query.andWhere('vendor.status like :status', { status: status === 'active' });
  }

  if (startAt && endAt) {
    query.andWhere('user.createdAt BETWEEN :startAt AND :endAt', { startAt, endAt });
  }

  const [vendor, count] = isFilters
    ? await query.getManyAndCount()
    : await getManager()
        .createQueryBuilder(Users, 'user')
        .where('user.userType = :userType', { userType: PropaneUserType.VENDOR }) // static userType vendor
        .andWhere('user.isActive = :isActive', { isActive: true })
        .leftJoin('user.vendor', 'vendor')
        .andWhere('vendor.profileCompletedStatus >= 6')
        .getManyAndCount(); // TODO: await vendorsRepository.findAndCount({ userType: 'vendor' });

  res.status(200).json({ vendor, count });
};

const namePattern = '^[A-za-z]';
export const addVendorValidation = {
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).required(),
    email: Joi.string().lowercase().max(255).email().required(),
    countryCode: Joi.string().required(),
    mobileNumber: Joi.number().required(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default('vendor')
      .required(),
    profileImage: Joi.string().optional(),
    status: Joi.number().required(),
    zipcodeIds: Joi.array().items(Joi.number().optional()).required(),
  }),
};
/**
 * Title: Add Vendor API (Admin Only):
 * Created By: Sarang Patel;
 * steps:
 *    1) Find Users Data By email, userType, countryCode, mobileNumber fields.
 *    3) Create user with request parameters.
 *    4) Create Vendor details.
 *    5) Add verifications as verified for the same user.
 *    6) Set the created user data as a response with 201 status.
 */
export const addVendor = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: {
      email,
      status,
      userType,
      fullName,
      zipcodeIds,
      profileImage,
      countryCode,
      mobileNumber,
    },
  } = req;

  const usersRepo = getRepository(Users);
  const vendorDetailsRepo = getRepository(VendorDetails);
  const userVerificationRepo = getRepository(UserVerificationDetails);

  const existingUser = await usersRepo.findOne({ email, userType, countryCode, mobileNumber });

  if (existingUser) {
    throw new BadRequestError('Email address already used', 'EMAIL_ALREADY_EXIST');
  }

  let userData = usersRepo.create({
    email,
    userType,
    fullName,
    countryCode,
    profileImage,
    mobileNumber,
  });
  userData = await usersRepo.save(userData);

  let vendor = vendorDetailsRepo.create({
    status,
    zipcodeIds,
    user: userData,
    createdBy: user?.id,
    updatedBy: user?.id,
    isResetPassword: false,
  });

  vendor = await vendorDetailsRepo.save(vendor);

  if (userData && userData.id) {
    const verificationTypes = [1, 2];
    verificationTypes.forEach(async (type: number) => {
      const newVerification = userVerificationRepo.create({
        type,
        verified: true,
        user: userData,
      });
      await userVerificationRepo.save(newVerification);
    });
  }

  const service = new StripeCustomersService();
  const result = await service.execute({
    userId: user?.id,
    email: user?.email,
    name: user?.fullName,
    action: Actions.CREATE,
  });

  await usersRepo.update(userData?.id, { stripeCustomerId: result?.stripeCustomerId });
  vendor = Object.assign({}, vendor, { user: undefined });
  userData = Object.assign({}, userData, { vendor, password: undefined });

  res.status(201).json(userData);
};

export const updateVendorValidation = {
  body: Joi.object({
    fullName: Joi.string().max(255).regex(new RegExp(namePattern)).optional(),
    email: Joi.string().lowercase().max(255).email().optional(),
    countryCode: Joi.string().optional(),
    mobileNumber: Joi.number().optional(),
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .default('vendor')
      .optional(),
    profileImage: Joi.string().optional(),
    status: Joi.number().optional(),
    zipcodeIds: Joi.array().items(Joi.number().optional()).optional(),
    accessoryIds: Joi.array().items(Joi.number().optional()).optional(),
    businessName: Joi.string().optional(),
    businessAddress: Joi.string().optional(),
    currentTab: Joi.number().optional(),
    comissionFee: Joi.number().optional(),
    leakageFee: Joi.number().optional(),
    businessProof: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional(),
          documentType: Joi.number().required().default(0),
          documentUrl: Joi.array().items(Joi.string().required().default(null)),
        }).optional(),
      )
      .optional(),
    schedule: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().min(1).optional(),
          timeslotId: Joi.number().min(1).required(),
          maxAcceptOrderLimit: Joi.number().required(),
          day: Joi.number().max(8).required(),
          isChecked: Joi.boolean().required(),
        }).optional(),
      )
      .optional(),
  }),
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
/**
 * Title: Vendor Update (steps)
 * Created By: Sarang Patel;
 */
export const updateVendor = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    params: { id },
    body: {
      fullName,
      email,
      countryCode,
      mobileNumber,
      profileImage,
      zipcodeIds,
      status,
      businessName,
      businessAddress,
      currentTab,
      accessoryIds,
      comissionFee,
      leakageFee,
      businessProof,
      schedule,
    },
  } = req;

  const usersRepo = getRepository(Users);
  const documentsRepo = getRepository(Documents);
  const vendorScheduleRepo = getRepository(VendorSchedule);
  const vendorDetailsRepo = getRepository(VendorDetails);

  const { vendor, ...userData } = await usersRepo.findOneOrFail({
    where: { id },
    relations: ['vendor'],
  });

  // TODO: remove any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vendorUpdate: any = {};
  if (currentTab === 1) {
    if (fullName !== undefined) userData.fullName = fullName;
    if (email !== undefined) userData.email = email;
    if (countryCode !== undefined) userData.countryCode = countryCode;
    if (mobileNumber !== undefined) userData.mobileNumber = mobileNumber;
    if (profileImage !== undefined) userData.profileImage = profileImage;
    await usersRepo.save(userData);

    if (zipcodeIds !== undefined) vendorUpdate.zipcodeIds = zipcodeIds;
    if (status !== undefined) vendorUpdate.status = status;
  } else if (currentTab === 2) {
    if (businessName !== undefined) vendorUpdate.businessName = businessName;
    if (businessAddress !== undefined) vendorUpdate.businessAddress = businessAddress;
    if (businessProof && businessProof.length) {
      const businessProofDocArr = [];
      for (let i = 0; i < businessProof.length; i++) {
        for (let j = 0; j < businessProof[i]?.documentUrl?.length; j++) {
          businessProofDocArr.push({
            documentType: businessProof[i].documentType,
            documentUrl: businessProof[i]?.documentUrl[j],
            user: userData,
          });
        }
      }
      await documentsRepo.save(businessProofDocArr);
    }
  } else if (currentTab === 4) {
    if (accessoryIds !== undefined) vendorUpdate.accessoryIds = accessoryIds;
  } else if (currentTab === 5) {
    if (schedule && schedule.length) {
      for (let index = 0; index < schedule.length; index++) {
        if (!schedule[index]?.id) {
          schedule[index] = {
            vendor,
            day: schedule[index]?.day,
            isChecked: schedule[index]?.isChecked,
            maxAcceptOrderLimit: schedule[index]?.maxAcceptOrderLimit,
            timeSlot: await getManager()
              .getRepository(TimeSlots)
              .findOne(schedule[index]?.timeslotId),
          };
        }
      }
      await vendorScheduleRepo.save(schedule);
    }
  } else if (currentTab === 6) {
    if (comissionFee !== undefined) vendorUpdate.comissionFee = comissionFee;
    if (leakageFee !== undefined) vendorUpdate.leakageFee = leakageFee;

    if (vendor?.profileCompletedStatus !== 6) {
      const vendorPassword = generateRandomHex(4);
      const password = await hash(vendorPassword, 8);
      const mailService = new MailService();
      const mailBody = {
        to: userData?.email,
        email: userData?.email,
        password: vendorPassword,
        actor: userData?.userType,
        subject: 'Vendor Registration',
        text: 'vendor_registration', // TODO: set a variable enum in the constants.
        fullname: userData?.fullName,
        mobileNo: `${userData?.countryCode}${userData?.mobileNumber}`,
      };
      mailService.send(mailBody);
      await usersRepo.update(userData?.id, { password });
    }
  }

  await vendorDetailsRepo.save({
    id: vendor?.id,
    ...vendorUpdate,
    profileCompletedStatus:
      currentTab >= vendor?.profileCompletedStatus ? currentTab : vendor?.profileCompletedStatus,
    updatedBy: user?.id,
  });

  res.sendStatus(200);
};

export const getVendorByUserIdValidation = {
  query: Joi.object({
    userType: Joi.string()
      .valid(...Object.values(PropaneUserType))
      .required(),
  }),
  params: Joi.object({
    id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
export const getVendorByUserId = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
    query: { userType },
  } = req;

  const query = getManager()
    .createQueryBuilder(Users, 'users')
    .addSelect([
      'users.id',
      'users.fullName',
      'users.email',
      'users.countryCode',
      'users.mobileNumber',
      'users.profileImage',
      'users.isActive',
    ])
    .where('users.id = :id', { id })
    .andWhere('users.userType = :userType', { userType })
    .leftJoin('users.vendor', 'vendor')
    .addSelect([
      'vendor.id',
      'vendor.status',
      'vendor.businessName',
      'vendor.businessAddress',
      'vendor.comissionFee',
      'vendor.leakageFee',
      'vendor.zipcodeIds',
      'vendor.accessoryIds',
      'vendor.profileCompletedStatus',
    ])
    .leftJoin('users.documents', 'documents')
    .addSelect(['documents.id', 'documents.documentUrl', 'documents.documentType'])
    .leftJoin('vendor.vendorSchecules', 'vendorSchecules')
    .addSelect([
      'vendorSchecules.id',
      'vendorSchecules.status',
      'vendorSchecules.maxAcceptOrderLimit',
      'vendorSchecules.day',
      'vendorSchecules.isChecked',
    ])
    .leftJoin('vendorSchecules.timeSlot', 'timeSlot')
    .addSelect(['timeSlot.id', 'timeSlot.startTime', 'timeSlot.endTime', 'timeSlot.status'])
    .leftJoinAndSelect('users.vendorProducts', 'vendorProducts')
    .leftJoinAndSelect('vendorProducts.product', 'product')
    .leftJoinAndSelect('vendorProducts.pricing', 'pricing')
    .leftJoinAndSelect('product.details', 'details')
    .leftJoinAndSelect('vendorProducts.tiers', 'tiers');

  const user = await query.getOne();
  res.json(user);
};

export const deleteVendorValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const removeVendors = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const userRepository = getRepository(Users);
  await userRepository.findOneOrFail(id);

  await getManager().transaction(async (em) => {
    await em.update(Users, { id }, { updatedBy: userId });
    await em.softDelete(Users, id);
  });

  res.sendStatus(204);
};

export const getVendorsBankDetailsValidation = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(100),
  }),
};
export const getvendorBankDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    query: { page, perPage },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const bankDetailRepo = getCustomRepository(VendorBankDetailsRepository);
  const [bankDetails, count] = await bankDetailRepo.findAndCount({
    where: { user },
    take: limit,
    skip: offset,
  });

  res.json({ bankDetails, count });
};

export const createBankDetailsValidation = {
  body: Joi.object({
    bankName: Joi.string().min(0).required(),
    accountHolderName: Joi.string().min(0).required(),
    accountNumber: Joi.number().min(0).required(),
    branchName: Joi.string().min(0).required(),
    branchCode: Joi.string().min(0).required(),
  }),
};
export const createBankDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { bankName, accountHolderName, accountNumber, branchName, branchCode },
  } = req;

  const bankDetailRepo = getCustomRepository(VendorBankDetailsRepository);
  const existingBankDetails = await bankDetailRepo.findOne({
    where: { user, bankName, accountHolderName, accountNumber, branchName, branchCode },
  });
  if (existingBankDetails) {
    throw new BadRequestError('Bank Details is already exist', 'BANK_DETAILS_IS_EXIST');
  }

  let bankDetails = bankDetailRepo.create({
    user,
    bankName,
    branchName,
    branchCode,
    accountNumber,
    accountHolderName,
  });

  bankDetails = await bankDetailRepo.save(bankDetails);

  // filter response data
  bankDetails = Object.assign({}, bankDetails, { user: undefined });
  res.status(201).json(bankDetails);
};

export const updateBankDetailsValidation = {
  body: Joi.object({
    bankName: Joi.string().min(0).required(),
    accountHolderName: Joi.string().min(0).required(),
    accountNumber: Joi.number().min(0).required(),
    branchName: Joi.string().min(0).required(),
    branchCode: Joi.string().min(0).required(),
  }),
};
export const updateBankDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user,
    body: { bankName, accountHolderName, accountNumber, branchName, branchCode },
    params: { id },
  } = req;
  const bankDetailRepo = getCustomRepository(VendorBankDetailsRepository);
  await bankDetailRepo.findByIdOrFail(id);

  const existingBankDetails = await bankDetailRepo.findOne({
    where: { id: Not(id), user, accountNumber, branchName, branchCode },
  });
  if (existingBankDetails) {
    throw new BadRequestError('Bank Details is already exist', 'BANK_DETAILS_IS_EXIST');
  }

  await bankDetailRepo.update(id, {
    bankName,
    accountHolderName,
    accountNumber,
    branchName,
    branchCode,
    updatedBy: user?.id,
  });
  res.sendStatus(204);
};

export const getvendorBankDetailsByIdValidation = {
  params: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),
};
export const getvendorBankDetailsById = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    params: { id },
  } = req;

  const bankDetailRepo = getCustomRepository(VendorBankDetailsRepository);
  const bankDetail = await bankDetailRepo.findOneOrFail(id);

  res.json(bankDetail);
};

export const deletevendorBankDetailsByIdValidation = {
  params: Joi.object({
    id: Joi.number().integer().min(1).required(),
  }),
};
export const deletevendorBankDetailsById = () => async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    user: { id: userId },
    params: { id },
  } = req;

  const bankDetailRepo = getCustomRepository(VendorBankDetailsRepository);
  await bankDetailRepo.findOneOrFail(id);

  await getManager().transaction(async (em) => {
    await em.update(VendorBankDetails, { id }, { updatedBy: userId });
    await em.softDelete(VendorBankDetails, id);
  });

  res.sendStatus(204);
};

export const allCustomerListValidation = {
  query: Joi.object({
    vendorId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
export const allCustomerList = () => async (req: Request, res: Response): Promise<void> => {
  const {
    query: { vendorId },
  } = req;

  const query = getManager()
    .createQueryBuilder(Users, 'users')
    .select([
      'users.id',
      'users.fullName',
      'users.mobileNumber',
      'users.email',
      'users.password',
      'users.countryCode',
      'users.userType',
      'users.profileImage',
      'users.createdAt',
      'users.isActive',
    ])
    .leftJoin('users.orders', 'orders')
    .addSelect(['orders.createdAt'])
    .orderBy('orders.createdAt', 'DESC')
    .leftJoin('orders.details', 'orderdetail')
    .where('orderdetail.vendor = :vendor', { vendor: vendorId });

  const [customers, count] = await query.getManyAndCount();
  const customersData = (customers || []).map((list) => {
    return {
      ...list,
      LastPurchaseOn: list?.orders[0],
      orders: undefined,
    };
  });

  res.status(200).json({ customers: customersData, count });
};

export const getAllVendorOptions = () => async (req: Request, res: Response): Promise<void> => {
  const usersRepo = getRepository(Users);

  const [vendors, count] = await usersRepo.findAndCount({
    where: { isActive: true, userType: PropaneUserType.VENDOR },
    select: ['id', 'fullName'],
  });

  res.status(200).json({ vendors, count });
};

export const getVendorsOrdersValidation = {
  params: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
  query: Joi.object({
    endAt: Joi.date().optional(),
    startAt: Joi.date().optional(),
    status: Joi.alternatives(
      Joi.array()
        .items(Joi.alternatives(Joi.number().integer().min(0).optional(), Joi.string().optional()))
        .optional(),
      Joi.string()
        .valid(...Object.values(OrderStatus))
        .default(null),
    ),
    sort: Joi.string().valid('ASC', 'DESC').default('DESC'),
    sortBy: Joi.string().default('createdAt'),
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).default(20),
    search: Joi.string().max(50).default(null).optional(),
    orderType: Joi.number().integer().min(1).max(2).optional(),
    categoryId: Joi.number().integer().default(null).optional(),
    driverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    customerId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
    freelanceDriverId: Joi.string().uuid({ version: 'uuidv4' }).optional().default(null),
  }),
};
export const getVendorsOrders = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
    query: {
      sort,
      page,
      endAt,
      status,
      search,
      sortBy,
      startAt,
      perPage,
      driverId,
      orderType,
      categoryId,
      customerId,
      freelanceDriverId,
    },
  } = req;

  const limit = Number(perPage);
  const offset = (Number(page) - 1) * limit;

  const query = getManager()
    .createQueryBuilder(OrderDetails, 'orderDetails')
    .andWhere('orderDetails.vendor_id = :id', { id })
    .leftJoin('orderDetails.category', 'category')
    .addSelect(['category.id', 'category.name'])
    .leftJoinAndSelect('orderDetails.order', 'order')
    .leftJoin('order.user', 'user')
    .leftJoin('order.timeSlot', 'timeSlot')
    .leftJoin('order.userAddress', 'userAddress')
    .addSelect([
      'userAddress.countryCode',
      'userAddress.phoneNumber',
      'userAddress.addressType',
      'userAddress.houseNo',
      'userAddress.address',
      'userAddress.lat',
      'userAddress.long',
      'userAddress.fullName',
    ])

    .leftJoin('orderDetails.driver', 'driver')
    .leftJoinAndSelect('driver.driver', 'details')
    .leftJoin('orderDetails.vendor', 'vendor')
    .leftJoin('orderDetails.product', 'product')
    .addSelect([
      'user.id',
      'driver.id',
      'vendor.id',
      'user.fullName',
      'user.countryCode',
      'user.mobileNumber',
      'user.profileImage',
      'vendor.fullName',
      'driver.fullName',
      'driver.profileImage',
      'driver.mobileNumber',
      'product.name',
      'product.logo',
      'timeSlot.startTime',
      'timeSlot.endTime',
    ])
    .offset(offset)
    .limit(limit);

  if (freelanceDriverId || driverId) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('orderDetails.driver_id = :freelanceDriverId', { freelanceDriverId })
          .orWhere('orderDetails.driver_id = :driverId', { driverId });
      }),
    );
  }

  if (search && search !== null) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('user.full_name like :name', { name: '%' + search + '%' })
          .orWhere('driver.full_name like :name', { name: '%' + search + '%' })
          .orWhere('vendor.full_name like :name', { name: '%' + search + '%' });
      }),
    );
  }

  if (endAt && startAt) {
    query.andWhere(
      new Brackets((qb) => {
        return qb
          .orWhere('orderDetails.createdAt >= :startAt AND orderDetails.createdAt <= :endAt', {
            startAt,
            endAt,
          })
          .orWhere(
            'orderDetails.scheduleDate >= :startAt AND orderDetails.scheduleDate <= :endAt',
            {
              startAt,
              endAt,
            },
          );
      }),
    );
  }

  if (status && Array.isArray(status)) {
    query.andWhere('orderDetails.status IN (:...status)', { status });
  }

  if (status && status !== null) {
    query.andWhere('orderDetails.status = :status', { status });
  }

  if (orderType && orderType !== null) {
    query.andWhere('orderDetails.orderType = :orderType', { orderType });
  }

  if (categoryId && categoryId !== null) {
    query.andWhere('orderDetails.category_id = :categoryId', { categoryId });
  }

  if (customerId && customerId !== null) {
    query.andWhere('user.id = :customerId', { customerId });
  }

  if (sort && sortBy === 'driver') {
    query.orderBy('driver.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'vendor') {
    query.orderBy('vendor.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'customer') {
    query.orderBy('user.fullName', sort as 'ASC' | 'DESC');
  }
  if (sort && sortBy === 'createdAt') {
    query.orderBy('orderDetails.created_at', sort as 'ASC' | 'DESC');
  }

  const [orders, count] = await query.getManyAndCount();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = {
    orders,
    count,
  };
  if (orders && orders.length) {
    response.orders = orders.map((orderDetails) => {
      return {
        ...orderDetails,
        lat: orderDetails?.order?.lat,
        long: orderDetails?.order?.long,
        userId: orderDetails?.order?.userId,
        address: orderDetails?.order?.address,
        timeSlotstartTime: orderDetails?.order?.timeSlot?.startTime,
        timeSlotendTime: orderDetails?.order?.timeSlot?.endTime,
        timeSlotsId: orderDetails?.order?.timeSlotsId,
        invoicedReceiptUrl: orderDetails?.order?.invoicedReceiptUrl,
        vendorName: orderDetails?.vendor?.fullName || '',
        driverName: orderDetails?.driver?.fullName || '',
        driverProfileImage: orderDetails?.driver?.profileImage || '',
        driverMobileNumber: orderDetails?.driver?.mobileNumber || '',
        userName: orderDetails?.order?.user?.fullName,
        userProfileImage: orderDetails?.order?.user?.profileImage || '',
        categoryName: orderDetails?.category?.name || '',
        isVendorsDriver: orderDetails?.driver?.driver?.vendorId ? 1 : 0,
        vehicleNo: orderDetails?.driver?.driver?.vehicalNo || '',
        driverLat: orderDetails?.driver?.driver?.lat || '',
        driverLong: orderDetails?.driver?.driver?.long || '',
        countryCode: orderDetails?.order.userAddress?.countryCode || '',
        phoneNumber: orderDetails?.order.userAddress?.phoneNumber || '',
        addressType: orderDetails?.order.userAddress?.addressType || '',
        addressName: orderDetails?.order.userAddress?.fullName || '',
        productName: orderDetails?.product?.name || orderDetails?.accessory?.name || '',
        productImage: orderDetails?.product?.logo || orderDetails?.accessory?.image || '',
        serviceCharge: orderDetails?.order.serviceCharge,
        serviceFee: orderDetails?.order.serviceFee || '',
        order: undefined,
        vendor: undefined,
        driver: undefined,
        category: undefined,
        product: undefined,
      };
    });
  }
  res.status(200).json({ ...response });
};

export const removeVendorValidation = {
  query: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const deleteVendors = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    query: { id },
  } = req;

  const userRepository = getRepository(Users);
  await userRepository.findOneOrFail({ where: { id } });

  const query = getManager()
    .createQueryBuilder(VendorProducts, 'VendorProduct')
    .select(['VendorProduct.id'])
    .where('VendorProduct.vendor = :vendor', { vendor: id });

  const vendorProducts = await query.getMany();
  const vendorProductIds = (vendorProducts || []).map((VProducts) => VProducts.id);

  await getManager().transaction(async (em) => {
    await em.update(Users, { id }, { updatedBy: userId });
    await em.softDelete(Users, id);
    await em.update(VendorBankDetails, { user: id }, { updatedBy: userId });
    await em.softDelete(VendorBankDetails, { user: id });
    await em.update(UserVerificationDetails, { user: id }, {});
    await em.softDelete(UserVerificationDetails, { user: id });
    await em.update(UserAddresses, { user: id }, { updatedBy: userId });
    await em.softDelete(UserAddresses, { user: id });
    await em.update(VendorDetails, { user: id }, { updatedBy: userId });
    await em.softDelete(VendorDetails, { user: id });
    await em.update(VendorProducts, { vendor: id }, { updatedBy: userId });
    await em.softDelete(VendorProducts, { vendor: id });
    await em.update(
      VendorProductsPricing,
      { vendorProduct: In(vendorProductIds) },
      { updatedBy: userId },
    );
    await em.softDelete(VendorProductsPricing, { vendorProduct: In(vendorProductIds) });
    await em.update(
      VendorProductTiers,
      { vendorProduct: In(vendorProductIds) },
      { updatedBy: userId },
    );
    await em.softDelete(VendorProductTiers, { vendorProduct: In(vendorProductIds) });
  });

  res.sendStatus(204);
};

export const restoreVendorValidation = {
  body: Joi.object({ id: Joi.string().uuid({ version: 'uuidv4' }).required() }),
};
export const restoreVendors = () => async (req: Request, res: Response): Promise<void> => {
  const {
    user: { id: userId },
    body: { id },
  } = req;

  await getManager().transaction(async (em) => {
    await em.restore(Users, id);
    await em.update(Users, { id }, { updatedBy: userId });
    await em.restore(VendorBankDetails, { user: id });
    await em.update(VendorBankDetails, { user: id }, { updatedBy: userId });
    await em.restore(UserVerificationDetails, { user: id });
    await em.update(UserVerificationDetails, { user: id }, {});
    await em.restore(UserAddresses, { user: id });
    await em.update(UserAddresses, { user: id }, { updatedBy: userId });
    await em.restore(VendorDetails, { user: id });
    await em.update(VendorDetails, { user: id }, { updatedBy: userId });
    await em.restore(VendorProducts, { vendor: id });
    await em.update(VendorProducts, { vendor: id }, { updatedBy: userId });
  });

  const query = getManager()
    .createQueryBuilder(VendorProducts, 'VendorProduct')
    .select(['VendorProduct.id'])
    .where('VendorProduct.vendor = :vendor', { vendor: id });

  const vendorProducts = await query.getMany();
  const vendorProductIds = (vendorProducts || []).map((VProducts) => VProducts.id);

  await getManager().transaction(async (em) => {
    await em.update(
      VendorProductsPricing,
      { vendorProduct: In(vendorProductIds) },
      { updatedBy: userId },
    );
    await em.restore(VendorProductsPricing, { vendorProduct: In(vendorProductIds) });
    await em.update(
      VendorProductTiers,
      { vendorProduct: In(vendorProductIds) },
      { updatedBy: userId },
    );
    await em.restore(VendorProductTiers, { vendorProduct: In(vendorProductIds) });
  });

  res.sendStatus(204);
};

export const driverDetailValidation = {
  params: Joi.object({
    id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  }),
};
export const driverDetails = () => async (req: Request, res: Response): Promise<void> => {
  const {
    params: { id },
  } = req;

  const query = getManager()
    .createQueryBuilder(Users, 'user')
    .select([
      'user.id',
      'user.fullName',
      'user.email',
      'user.mobileNumber',
      'user.userType',
      'user.profileImage',
    ])
    .leftJoin('user.driverOrders', 'orderdetail')
    .addSelect(['orderdetail.orderType'])
    .addSelect('SUM(orderdetail.isDelivered = 0) "assigneOrder"')
    .addSelect('SUM(orderdetail.isDelivered = 1) "completedOrder"')
    .orWhere('orderdetail.driver_id = :id', { id })
    .leftJoin('user.driver', 'driver')
    .addSelect(['driver.isApproved', 'driver.vehicalNo']);

  const details = await query.getRawOne();

  res.status(200).json({ details });
};
