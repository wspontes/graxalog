'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import { api } from '@/lib/api';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<any[]>([]);
  const [stockPkgs, setStockPkgs] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [newRoute, setNewRoute] = useState({ name: '', deliveryPersonId: 0, packageIds: [] as number[] });

  useEffect(() => {
    api.routes.list().then(setRoutes);
    api.deliveryPeople.list().then(setDeliveryPeople);
    api.packages.list({ status: 'in_stock' }).then(setStockPkgs);
  }, []);

  async function handleCreate() {
    await api.routes.create(newRoute);
    setShowCreate(false);
    setNewRoute({ name: '', deliveryPersonId: 0, packageIds: [] });
    api.routes.list().then(setRoutes);
  }

  function togglePackage(id: number) {
    setNewRoute((prev) => ({
      ...prev,
      packageIds: prev.packageIds.includes(id)
        ? prev.packageIds.filter((p) => p !== id)
        : [...prev.packageIds, id],
    }));
  }

  const routeStatusLabels: Record<string, string> = {
    not_started: 'Não iniciada', in_progress: 'Em andamento', partially_completed: 'Parcial', completed: 'Concluída',
  };
  const routeStatusColors: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700',
    partially_completed: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700',
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 lg:ml-[260px]">
        <Header />
        <main className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold">Rotas</h2>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              + Nova Rota
            </button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Entregador</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Pacotes</th>
                  <th className="p-3 font-medium">Entregues</th>
                  <th className="p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{r.delivery_person_name || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${routeStatusColors[r.status]}`}>
                        {routeStatusLabels[r.status]}
                      </span>
                    </td>
                    <td className="p-3">{r.total_packages}</td>
                    <td className="p-3">{r.delivered_count}</td>
                    <td className="p-3">
                      <button onClick={async () => { const d = await api.routes.getById(r.id); setSelected(d); }} className="text-xs text-primary-600 hover:underline">
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4">Nova Rota</h3>
                <div className="space-y-3 mb-4">
                  <input placeholder="Nome da rota" value={newRoute.name} onChange={(e) => setNewRoute({...newRoute, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <select value={newRoute.deliveryPersonId} onChange={(e) => setNewRoute({...newRoute, deliveryPersonId: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value={0}>Selecione um entregador</option>
                    {deliveryPeople.filter((d) => d.active).map((dp) => <option key={dp.id} value={dp.id}>{dp.name}</option>)}
                  </select>
                </div>
                <h4 className="font-medium text-sm mb-2">Pacotes em estoque ({stockPkgs.length})</h4>
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y text-sm">
                  {stockPkgs.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={newRoute.packageIds.includes(p.id)} onChange={() => togglePackage(p.id)} />
                      <span className="font-mono text-xs">{p.code}</span> - {p.recipient} - {p.neighborhood}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleCreate} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">
                    Criar Rota ({newRoute.packageIds.length} pacotes)
                  </button>
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {selected && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">{selected.name}</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Status:</strong> {routeStatusLabels[selected.status]}</p>
                  <p><strong>Entregador:</strong> {selected.delivery_person_name}</p>
                  <p><strong>Total:</strong> {selected.total_packages}</p>
                  <p><strong>Entregues:</strong> {selected.delivered_count}</p>
                  <p><strong>Ausentes:</strong> {selected.absent_count}</p>
                  <p><strong>Terceiros:</strong> {selected.third_party_count}</p>
                  {selected.started_at && <p><strong>Início:</strong> {new Date(selected.started_at).toLocaleString()}</p>}
                  {selected.finished_at && <p><strong>Término:</strong> {new Date(selected.finished_at).toLocaleString()}</p>}
                </div>
                <h4 className="font-medium mt-4 mb-2 text-sm">Pacotes na rota</h4>
                <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                  {selected.packages?.map((p: any) => (
                    <div key={p.id} className="p-2 bg-gray-50 rounded flex justify-between">
                      <span>{p.code} - {p.recipient}</span>
                      <span>{p.status}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-sm">Fechar</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
