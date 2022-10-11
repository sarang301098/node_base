import dotenv from 'dotenv';
import envalid from 'envalid';

dotenv.config();

export const getEnv = () => {
  return envalid.cleanEnv(process.env, {
    TEST_DATABASE_URL: envalid.url({
      default: 'test',
    }),
  });
};

export function parse(connectionStr) {
  const matcher = /^(?:([^:/?#\s]+):\/{2})?(?:([^@/?#\s]+)@)?([^/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
  const matches = matcher.exec(connectionStr);
  if (!matches) {
    throw new Error('connection string is not valid');
  }
  if (matches.length === 0) {
    throw new Error('wrong connection string');
  }
  return {
    dialect: matches[1],
    username: matches[2] !== undefined ? matches[2].split(':')[0] : undefined,
    password: matches[2] !== undefined ? matches[2].split(':')[1] : undefined,
    host: matches[3] !== undefined ? matches[3].split(/:(?=\d+$)/)[0] : undefined,
    port: matches[3] !== undefined ? matches[3].split(/:(?=\d+$)/)[1] : undefined,
    database: matches[4],
  };
}

export const buildTestDbUrl = function (dbUrl, dbName) {
  const { dialect, host, port, password } = parse(dbUrl);
  const testDatabaseUrl = `${dialect}://${dbName}:${password}@${host}:${port}/${dbName}`;
  return testDatabaseUrl;
};
