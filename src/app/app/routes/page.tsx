'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getQueueLength } from '@/lib/offline-queue';
import MobileLayout from '@/components/delivery/MobileLayout';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('@/components/delivery/DeliveryMap'), { ssr: false });

export default function RoutesPage() {
  const [activeRoutes, setActiveRoutes] = useState<any[]>([]);
  const [historyRoutes, setHistoryRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [geocoding, setGeocoding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }
    loadRoutes();
  }, []);

  async function loadRoutes() {
    try {
      const [active, history] = await Promise.all([
        api.delivery.routes(),
        api.delivery.routes({ history: 'true' }),
      ]);
      setActiveRoutes(active);
      setHistoryRoutes(history);
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

  const routes = tab === 'active' ? activeRoutes : historyRoutes;

  async function handleGeocode() {
    if (!selectedRoute) return;
    setGeocoding(true);
    try {
      const updated = await api.delivery.geocodeRoute(selectedRoute.id);
      setSelectedRoute(updated);
    } catch (e) {
      console.error('Geocoding error:', e);
    }
    setGeocoding(false);
  }

  async function loadRouteDetail(id: number) {
    try {
      const data = await api.delivery.routeDetail(id);
      setSelectedRoute(data);
    } catch {
      const found = routes.find((r: any) => r.id === id);
      if (found) setSelectedRoute(found);
    }
  }

  return (
    <MobileLayout>
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-700 text-center">
          {pendingCount} atualização(ões) pendente(s) de sincronização
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Minhas Rotas</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('active')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Ativas ({activeRoutes.length})
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Histórico ({historyRoutes.length})
        </button>
      </div>

      {routes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🗺️</p>
          <p>{tab === 'active' ? 'Nenhuma rota ativa' : 'Nenhuma rota concluída'}</p>
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
                <span>✓ {route.delivered_count || 0}</span>
                <span>✗ {route.absent_count || 0}</span>
                <span>◉ {route.third_party_count || 0}</span>
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
                {(route.status === 'completed' || route.status === 'partially_completed') && (
                  <button onClick={() => loadRouteDetail(route.id)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">
                    Ver Detalhes
                  </button>
                )}
              </div>

              {route.started_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {route.status === 'completed' || route.status === 'partially_completed'
                    ? `Concluída: ${route.finished_at ? new Date(route.finished_at).toLocaleString() : '-'}`
                    : `Iniciada: ${new Date(route.started_at).toLocaleString()}`
                  }
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedRoute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center" onClick={() => setSelectedRoute(null)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{selectedRoute.name}</h3>
              <button onClick={() => setSelectedRoute(null)} className="text-gray-400">✕</button>
            </div>

            {(selectedRoute.packages?.length > 0) && (
              <div className="mb-4">
                <DeliveryMap packages={selectedRoute.packages} geocoding={geocoding} onGeocode={handleGeocode} onReorder={(ordered) => setSelectedRoute({ ...selectedRoute, packages: ordered })} />
              </div>
            )}

            <div className="space-y-2 text-sm">
              {selectedRoute.packages?.map((pkg: any, i: number) => (
                <div key={pkg.id || pkg.package_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-bold text-gray-400 mt-0.5">#{pkg.stop_order || i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{pkg.recipient}</p>
                    <p className="text-xs text-gray-500 truncate">{pkg.address}</p>
                    <p className="text-xs text-gray-400">{pkg.neighborhood}{pkg.city ? `, ${pkg.city}` : ''}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    pkg.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                    pkg.status === 'absent' ? 'bg-orange-100 text-orange-700' :
                    pkg.status === 'third_party' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {pkg.status === 'delivered' ? 'OK' : pkg.status === 'absent' ? 'Aus' : pkg.status === 'third_party' ? '3º' : '-'}
                  </span>
                </div>
              ))}
              {(!selectedRoute.packages || selectedRoute.packages.length === 0) && (
                <p className="text-center text-gray-400 py-4">Nenhum pacote nesta rota</p>
              )}
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
