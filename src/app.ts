import express, { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validation';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import multer from 'multer';
import cors from 'cors';

import { AppError, NotFoundError, RequestTimeoutError } from './error';
import config from './config';
import routesV2 from './route/v2';
import routes from './route';
import path from 'path';

const app = express();
app.use(
  '/img',
  express.static(path.join(__dirname, 'database', 'seed', 'table', 'htmlTemplate', 'img')),
);
app.set('port', config.PORT);
app.use('/webhook', bodyParser.raw({ type: '*/*' }));

app.use(helmet());
app.use(cookieParser());
app.use(multer().array('test'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*' || config.WHITELIST_ORIGINS, credentials: true }));
app.use(compression());
// TODO: Only apply to long request
app.use((req, res, next) => {
  res.setTimeout(config.GLOBAL_REQUEST_TIMEOUT_IN_MS, () =>
    next(new RequestTimeoutError(`Request timeout for: [${req.method}] ${req.originalUrl}`)),
  );
  next();
});

app.use('/v2', routesV2());
app.use('/', routes());

app.use((req) => {
  throw new NotFoundError(
    `We are unable to locate requested API resource: [${req.method}] ${req.originalUrl}`,
    'API_ENDPOINT_NOT_FOUND',
  );
});

if (config.SENTRY_DNS && config.isProd) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err: Error, req: Request, res: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err?.statusCode || 500).json({
      message: err.message ?? 'Internal Server Error',
      code: err.code ?? 'INTERNAL_SERVER_ERROR',
      ...(config.isDev && { stack: err?.stack }),
    });
  }

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err);
  }

  return res.status(500).json({
    message: err.message ?? 'Internal Server Error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(config.isDev && { stack: err?.stack }),
  });
});

export default app;
