import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL);
    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disconnect', () => console.log('Socket disconnected'));
  }
  return socket;
}

export function joinAdmin() {
  getSocket().emit('join:admin');
}

export function onPackageUpdate(callback: (data: any) => void) {
  getSocket().on('package:update', callback);
  return () => getSocket().off('package:update', callback);
}

export function onRouteUpdate(callback: (data: any) => void) {
  getSocket().on('route:update', callback);
  return () => getSocket().off('route:update', callback);
}

export function onDashboardUpdate(callback: (data: any) => void) {
  getSocket().on('dashboard:update', callback);
  return () => getSocket().off('dashboard:update', callback);
}
