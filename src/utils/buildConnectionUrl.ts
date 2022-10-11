import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';

export const buildConnectionUrl = (options: MongoConnectionOptions): string => {
  if (options.url) {
    return options.url;
  }

  const schemaUrlPart = options.type.toLowerCase();
  const credentialsUrlPart =
    options.username && options.password ? `${options.username}:${options.password}@` : '';
  const portUrlPart = schemaUrlPart === 'mongodb+srv' ? '' : `:${options.port || '27017'}`;

  return `${schemaUrlPart}://${credentialsUrlPart}${options.host || '127.0.0.1'}${portUrlPart}/${
    options.database || ''
  }`;
};
