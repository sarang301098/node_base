import { Request, Response } from 'express';
import { Joi } from 'express-validation';
import { compact, flatMap, map } from 'lodash';

import StripeOrderPaymentService from '../service/StripeOrderPayment';

export const createPaymentValidation = {
  body: Joi.object({
    userId: Joi.string().optional(),
    stripeCustomerId: Joi.string().optional(),
    stripeCardId: Joi.string().optional(),
    confirm: Joi.string().optional(),
    orderId: Joi.string().optional(),
    amount: Joi.string().optional(),
    currency: Joi.string().optional(),
    orderDetailIds: Joi.string().optional(),
  }),
};
export const createPayment = () => async (req: Request, res: Response): Promise<void> => {
  const {
    body: {
      userId,
      stripeCustomerId,
      stripeCardId,
      confirm,
      orderId,
      amount,
      currency,
      orderDetailIds,
    },
  } = req;

  const service = new StripeOrderPaymentService();
  const result = await service.execute({
    userId,
    stripeCustomerId,
    stripeCardId,
    confirm,
    orderId,
    amount,
    currency,
    orderDetailIds,
    isOrder: true,
  });

  res.status(200).json(result);
};

export const testLodash = () => async (req: Request, res: Response): Promise<void> => {
  const user = [
    {
      id: '06e7292a-6a32-4179-ae74-a477f5fe2f5f',
      fullName: 'test user 2',
      email: 'user+1@gmail.com',
      password: '$2a$08$lmiDZd/QKKSyrgU9SzOhyeFBaSAVfXtmeAdGXrgnGMujnt0ytnueq',
      countryCode: '+1',
      mobileNumber: '9999999999',
      otp: '',
      userType: 'user',
      profileImage: '',
      stripeCustomerId: 'cus_LcDJZYUYwe1YEd',
      userSubscriptionCount: 1,
      deletedAt: '',
      createdBy: '',
      updatedBy: '',
      isActive: true,
      token: [
        {
          id: 1,
          deviceId: 'dasdasdaswgferwgw',
          deviceType: 'android',
          forgetPasswordToken: '',
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: '',
        },
        {
          id: 1,
          deviceId: 'dasdasdaswgferwgw',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
        {
          id: 1,
          deviceId: 'dasdasdaswgferwgw',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
        {
          id: 1,
          deviceId: 'dasdasdaswgferwgw',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
        {
          id: 1,
          deviceId: 'dasdasdaswgferwgw',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
        {
          id: 2,
          deviceId: 'oekqwzkwo',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
      ],
    },
    {
      id: '06e7292a-6a32-4179-ae74-a477f5fe2f5f',
      fullName: 'test user 2',
      email: 'user+1@gmail.com',
      password: '$2a$08$lmiDZd/QKKSyrgU9SzOhyeFBaSAVfXtmeAdGXrgnGMujnt0ytnueq',
      countryCode: '+1',
      mobileNumber: '9999999999',
      otp: null,
      userType: 'user',
      profileImage: null,
      stripeCustomerId: 'cus_LcDJZYUYwe1YEd',
      userSubscriptionCount: 1,
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      isActive: true,
      token: [
        {
          id: 1,
          deviceId: 'dasdasdaswdasdasdasdagferwgw',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
        {
          id: 2,
          deviceId: 'oekqwdadadasdadasdasdadzkwo',
          deviceType: 'android',
          forgetPasswordToken: null,
          accessToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzEzMjEzNiwiYXVkIjoiYWNjZXNzX3Rva2VuIiwic3ViIjoiMDZlNzI5MmEtNmEzMi00MTc5LWFlNzQtYTQ3N2Y1ZmUyZjVmIn0.gcfXLBUMaYW7OA4ADS0gdxRPf2lo98MBrydN6IkKeQ4',
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2NTI3MDAxMzYsImV4cCI6MTY1MzU2NDEzNiwiYXVkIjoicmVmcmVzaF90b2tlbiIsInN1YiI6IjA2ZTcyOTJhLTZhMzItNDE3OS1hZTc0LWE0NzdmNWZlMmY1ZiJ9.0aR7GO-pmxvfh1jkjFKdFC4H_V_0gDsNvLjuvn6ksdQ',
          loginCount: 5,
          deletedAt: null,
        },
      ],
    },
    {
      id: '06e7292a-6a32-4179-ae74-a477f5fe2f5f',
      fullName: 'test user 2',
      email: 'user+1@gmail.com',
      password: '$2a$08$lmiDZd/QKKSyrgU9SzOhyeFBaSAVfXtmeAdGXrgnGMujnt0ytnueq',
      countryCode: '+1',
      mobileNumber: '9999999999',
      otp: null,
      userType: 'user',
      profileImage: null,
      stripeCustomerId: 'cus_LcDJZYUYwe1YEd',
      userSubscriptionCount: 1,
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      isActive: true,
      token: [],
    },
    {
      id: '06e7292a-6a32-4179-ae74-a477f5fe2f5f',
      fullName: 'test user 2',
      email: 'user+1@gmail.com',
      password: '$2a$08$lmiDZd/QKKSyrgU9SzOhyeFBaSAVfXtmeAdGXrgnGMujnt0ytnueq',
      countryCode: '+1',
      mobileNumber: '9999999999',
      otp: null,
      userType: 'user',
      profileImage: null,
      stripeCustomerId: 'cus_LcDJZYUYwe1YEd',
      userSubscriptionCount: 1,
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      isActive: true,
      token: null,
    },
    {
      id: '06e7292a-6a32-4179-ae74-a477f5fe2f5f',
      fullName: 'test user 2',
      email: 'user+1@gmail.com',
      password: '$2a$08$lmiDZd/QKKSyrgU9SzOhyeFBaSAVfXtmeAdGXrgnGMujnt0ytnueq',
      countryCode: '+1',
      mobileNumber: '9999999999',
      otp: null,
      userType: 'user',
      profileImage: null,
      stripeCustomerId: 'cus_LcDJZYUYwe1YEd',
      userSubscriptionCount: 1,
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      isActive: true,
      token: undefined,
    },
    {
      id: '06e7292a-6a32-4179-ae74-a477f5fe2f5f',
      fullName: 'test user 2',
      email: 'user+1@gmail.com',
      password: '$2a$08$lmiDZd/QKKSyrgU9SzOhyeFBaSAVfXtmeAdGXrgnGMujnt0ytnueq',
      countryCode: '+1',
      mobileNumber: '9999999999',
      otp: '',
      userType: 'user',
      profileImage: '',
      stripeCustomerId: 'cus_LcDJZYUYwe1YEd',
      userSubscriptionCount: 1,
      deletedAt: '',
      createdBy: '',
      updatedBy: '',
      isActive: true,
    },
  ];

  const deviceIds = compact(map(flatMap(map(user, 'token')), 'deviceId'));
  res.status(200).json({ deviceIds });
};

export const createAccountValidation = {
  body: Joi.object({
    country: Joi.string().optional(),
    email: Joi.string().optional(),
    userId: Joi.string().optional(),
    ip: Joi.string().optional(),
  }),
};
export const createAccount = () => async (req: Request, res: Response): Promise<void> => {
  res.status(200).json();
};
