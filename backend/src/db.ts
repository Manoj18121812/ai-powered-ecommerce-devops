import { Pool, QueryResultRow } from 'pg';
import { config } from './config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(1);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) {
  return pool.query<T>(text, params);
}
