import RateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getClientIp } from 'request-ip';

import { RedisService } from '../service/redis';
import { TooManyRequest } from '../error';
import config from '../config';

const openAPIsOptions = (maxRequest: number, timeWindow: number) => {
  const options: RateLimit.Options = {
    max: maxRequest,
    windowMs: timeWindow,
    keyGenerator: (req) => `${getClientIp(req) ?? req.ip}:${req.originalUrl}`,
    handler: (req, res, next) => next(new TooManyRequest()),
  };
  if (!config.isTest) {
    const redisService = new RedisService();
    options.store = new RedisStore({ client: redisService.getInstance() });
  }
  return options;
};

const closedAPIsOption = (maxRequest: number, timeWindow: number) => {
  const options: RateLimit.Options = {
    max: maxRequest,
    windowMs: timeWindow,
    keyGenerator: (req) => `${getClientIp(req) ?? req.ip}:${req.originalUrl}:${req.user.id}`,
    handler: (req, res, next) => next(new TooManyRequest()),
  };
  if (!config.isTest) {
    const redisService = new RedisService();
    options.store = new RedisStore({ client: redisService.getInstance() });
  }
  return options;
};

export const openLimiter = (
  maxRequest = config.OPEN_API_MAX_REQUEST,
  timeWindow = config.OPEN_API_WINDOW_IN_MS,
): RateLimit.RateLimit => RateLimit(openAPIsOptions(maxRequest, timeWindow));
export const closedLimiter = (
  maxRequest = config.CLOSED_API_MAX_REQUEST,
  timeWindow = config.CLOSED_API_WINDOW_IN_MS,
): RateLimit.RateLimit => RateLimit(closedAPIsOption(maxRequest, timeWindow));
