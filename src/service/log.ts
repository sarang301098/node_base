import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import { createLogger, format, transports } from 'winston';

import config from '../config';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

const logFormat = format.printf(({ level, message, timestamp, service, stack }) => {
  const scrubedMessage = scrubPasswords(message);
  if (stack) {
    return `[${timestamp}][${service}][${level}] ${scrubedMessage} \n ${stack}`;
  }
  return `[${timestamp}][${service}][${level}] ${scrubedMessage}`;
});

const logger = createLogger({
  level: config.LOG_LEVEL,
  format: format.combine(format.errors({ stack: true }), format.timestamp(), format.splat()),
  defaultMeta: { service: 'backend' },
  transports: [],
});

if (config.isDev || config.isTest) {
  logger.add(
    new transports.Console({
      silent: config.isTest,
      format: format.combine(format.colorize({ all: true }), logFormat),
    }),
  );
}

if (config.isDev || config.isProd) {
  logger.add(
    new WinstonDailyRotateFile({
      filename: 'PROPANE-BROS-%DATE%.log',
      dirname: 'logs',
      maxSize: '10m',
      maxFiles: '7d',
      auditFile: 'logs/log_audit.json',
      format: format.combine(format.uncolorize({ raw: true }), logFormat),
    }),
  );
}

const passwordMatcher = /'?[Pp]assword'?:*\s*('?[\w\d!-ö]*'?)/g;

/**
 * Scrubs passwords from the log messages.
 *
 * @param message - the log message
 */
function scrubPasswords(message: string): string {
  return message.replace(passwordMatcher, "'******'");
}

export default logger;
