import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(1);
});

export async function query<T = any>(text: string, params?: any[]) {
  return pool.query<T>(text, params);
}
