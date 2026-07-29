import http from 'http';
import app from './app';
import { env } from './config/env';
import { setupSocket } from './services/realtime';
import { log } from './utils/logger';

const server = http.createServer(app);
setupSocket(server);

server.listen(env.PORT, () => {
  log('info', `Server running on port ${env.PORT}`);
  log('info', `Health check: http://localhost:${env.PORT}/health`);
});
