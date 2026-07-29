import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/logistica_local',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002').split(','),
  MAPS_API_KEY: process.env.MAPS_API_KEY || '',
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
};
