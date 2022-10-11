export interface IDatabaseConfig {
  dialect: string;
  username?: string;
  password?: string;
  host?: string;
  port?: string;
  database: string;
}

export const parse = (connectionStr: string): IDatabaseConfig => {
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
};
