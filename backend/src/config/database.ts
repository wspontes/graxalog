import { Pool } from 'pg';
import { env } from './env';

const isNeon = env.DATABASE_URL.includes('neon.tech');
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ...(isNeon ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
  return res;
}
