import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export function setupSocket(httpServer: any) {
  io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join:admin', () => socket.join('admin'));
    socket.on('join:delivery', (userId) => socket.join(`delivery:${userId}`));
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });
  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitPackageUpdate(pkg: any) {
  if (!io) return;
  io.to('admin').emit('package:update', pkg);
}

export function emitRouteUpdate(route: any) {
  if (!io) return;
  io.to('admin').emit('route:update', route);
  if (route.delivery_person_id) {
    io.to(`delivery:${route.delivery_person_id}`).emit('route:update', route);
  }
}

export function emitDashboardUpdate(data: any) {
  if (!io) return;
  io.to('admin').emit('dashboard:update', data);
}
