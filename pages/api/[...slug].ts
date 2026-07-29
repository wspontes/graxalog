import type { NextApiRequest, NextApiResponse } from 'next';
import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('./uploads')));

process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'graxalog-jwt-secret-2026';

import '../../backend/src/config/env';
import routes from '../../backend/src/routes/index';

app.use('/api', routes);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}
