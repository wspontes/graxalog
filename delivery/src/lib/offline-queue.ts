const QUEUE_KEY = 'offline_queue';

export interface QueueItem {
  id: string;
  routeId: number;
  packageId: number;
  status: string;
  notes?: string;
  photoData?: string;
  createdAt: string;
}

export function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToQueue(item: Omit<QueueItem, 'id' | 'createdAt'>) {
  const queue = getQueue();
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export function clearQueue() {
  localStorage.setItem(QUEUE_KEY, '[]');
}

export function getQueueLength(): number {
  return getQueue().length;
}
