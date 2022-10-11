// setup.js
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

/**
 * NOTE:
 *
 * ts-node is required for running migration from src folder.
 * Alternativly use dist folder to run migration. In that case
 * you don't need `require('ts-node').register();`.
 */
import tsNode from 'ts-node';

import typeorm from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { getEnv, parse } from './helper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

tsNode.register();

const { TEST_DATABASE_URL } = getEnv();

const getDatabaseConfigs = (testDatabaseUrl) => {
  const { username, password, host, port, database, dialect } = parse(testDatabaseUrl);
  return {
    type: dialect,
    host,
    port,
    username,
    password,
    database,
    namingStrategy: new SnakeNamingStrategy(),
  };
};

const createTestDB = async (testDatabaseUrl) => {
  const { database, ...dbConfigs } = getDatabaseConfigs(testDatabaseUrl);
  /**
   * Note:
   *
   * Using default databse "postgres" to create connection.
   *
   * @see https://github.com/typeorm/typeorm/issues/809
   * @see https://github.com/typeorm/typeorm/issues/809#issuecomment-657052338
   */
  let connection = await typeorm.createConnection({ ...dbConfigs, database: 'postgres' });
  await connection.query(`CREATE DATABASE ${database} OWNER ${dbConfigs.username};`);
  await connection.close();
  connection = await typeorm.createConnection({ ...dbConfigs, database });
  await connection.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  await connection.query(`ALTER EXTENSION "uuid-ossp" SET SCHEMA public;`);
  await connection.close();
};

const runMigration = async (testDatabaseUrl) => {
  const dbConfigs = getDatabaseConfigs(testDatabaseUrl);
  const migrationPath = join(__dirname, '..', 'src/database/migration/**/*{.js,.ts}');
  const entityPath = join(__dirname, '..', 'src/model/*{.js,.ts}');
  const connection = await typeorm.createConnection({
    ...dbConfigs,
    migrations: [migrationPath],
    entities: [entityPath],
  });
  console.log('Run migrations...');
  await connection.runMigrations({ transaction: 'each' });
  console.log('Done running migrations.');
  await connection.close();
};

const runSeed = async (testDatabaseUrl) => {
  const dbConfigs = getDatabaseConfigs(testDatabaseUrl);
  const migrationPath = join(__dirname, '..', 'src/database/seed/**/*test{.js,.ts}');
  const entityPath = join(__dirname, '..', 'src/model/*{.js,.ts}');
  const connection = await typeorm.createConnection({
    ...dbConfigs,
    migrations: [migrationPath],
    migrationsTableName: 'seed',
    entities: [entityPath],
  });
  console.log('Running seed...');
  await connection.runMigrations();
  console.log('Done running seed.');
  await connection.close();
};

// export default expression;
export default async (config) => {
  console.log('\nStarting global start up');
  try {
    const dbConfigs = getDatabaseConfigs(TEST_DATABASE_URL);
    const connection = await typeorm.createConnection(dbConfigs);
    await connection.close();
  } catch (error) {
    if (error.code === '3D000') {
      // Database doesn't exist.
      // PG error code ref: https://docstore.mik.ua/manuals/sql/postgresql-8.2.6/errcodes-appendix.html
      console.log('Test db is missing. Creating test db...');
      await createTestDB(TEST_DATABASE_URL);
      console.log('Done creating test db.');
    } else {
      throw error;
    }
  }
  await runMigration(TEST_DATABASE_URL);
  await runSeed(TEST_DATABASE_URL);
};
