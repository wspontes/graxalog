'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getQueueLength } from '@/lib/offline-queue';
import MobileLayout from '@/components/delivery/MobileLayout';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    loadRoutes();
  }, []);

  async function loadRoutes() {
    try {
      const data = await api.delivery.routes();
      setRoutes(data);
      setPendingCount(getQueueLength());
    } catch {}
    setLoading(false);
  }

  async function handleStart(id: number) {
    await api.delivery.startRoute(id);
    loadRoutes();
  }

  const statusLabels: Record<string, string> = {
    not_started: 'Não iniciada', in_progress: 'Em andamento', partially_completed: 'Parcial', completed: 'Concluída',
  };
  const statusColors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700',
    partially_completed: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700',
  };

  if (loading) return <MobileLayout><p className="text-center text-gray-400 mt-8">Carregando...</p></MobileLayout>;

  return (
    <MobileLayout>
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-700 text-center">
          {pendingCount} atualização(ões) pendente(s) de sincronização
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Minhas Rotas</h2>

      {routes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🗺️</p>
          <p>Nenhuma rota atribuída</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{route.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColors[route.status]}`}>
                    {statusLabels[route.status]}
                  </span>
                </div>
                <span className="text-2xl font-bold text-primary-600">{route.total_packages}</span>
              </div>

              <div className="flex gap-3 text-xs text-gray-500 mt-2">
                <span>✓ {route.delivered_count}</span>
                <span>✗ {route.absent_count}</span>
                <span>◉ {route.third_party_count}</span>
              </div>

              <div className="flex gap-2 mt-3">
                {route.status === 'not_started' && (
                  <button onClick={() => handleStart(route.id)} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">
                    Iniciar Rota
                  </button>
                )}
                {(route.status === 'in_progress' || route.status === 'not_started') && (
                  <button onClick={() => router.push(`/app/routes/${route.id}`)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">
                    Ver Pacotes
                  </button>
                )}
                {route.status === 'in_progress' && (
                  <button onClick={async () => { await api.delivery.finishRoute(route.id); loadRoutes(); }} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm">
                    Encerrar Rota
                  </button>
                )}
              </div>

              {route.started_at && (
                <p className="text-xs text-gray-400 mt-2">Iniciada: {new Date(route.started_at).toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
}
