// teardown.js
import typeorm from 'typeorm';

import { getEnv, parse } from './helper.mjs';

const { TEST_DATABASE_URL } = getEnv();

const getDatabaseConfigs = (testDatabaseUrl) => {
  const { username, password, host, port, database, dialect } = parse(testDatabaseUrl);
  return { type: dialect, host, port, username, password, database };
};

export default async (_config) => {
  console.log('\nStarting global clean up');
  const { database, ...dbConfigs } = getDatabaseConfigs(TEST_DATABASE_URL);
  const connection = await typeorm.createConnection({ ...dbConfigs, database: 'postgres' });
  await connection.query(`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity
                          WHERE pg_stat_activity.datname = '${database}' AND pid <> pg_backend_pid();`);
  await connection.query(`DROP DATABASE IF EXISTS ${database};`);
  await connection.close();
  console.log('\nDone global clean up');
};
