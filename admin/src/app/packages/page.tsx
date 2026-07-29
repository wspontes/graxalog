'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: '', neighborhood: '', code: '', recipient: '' });
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { loadPackages(); }, []);

  async function loadPackages() {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const data = await api.packages.list(params);
    setPackages(data);
  }

  async function handleReturnStock(id: number) {
    await api.packages.returnStock(id);
    loadPackages();
  }

  const statusColors: Record<string, string> = {
    imported: 'bg-gray-100 text-gray-700',
    conferenced: 'bg-blue-100 text-blue-700',
    in_stock: 'bg-green-100 text-green-700',
    in_route: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-orange-100 text-orange-700',
    third_party: 'bg-purple-100 text-purple-700',
  };

  const statusLabels: Record<string, string> = {
    imported: 'Importado', conferenced: 'Conferido', in_stock: 'Em Estoque',
    in_route: 'Em Rota', delivered: 'Entregue', absent: 'Ausente', third_party: 'Terceiro',
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Pacotes</h2>

          <div className="bg-white rounded-xl border p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">Todos os status</option>
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input placeholder="Bairro" value={filters.neighborhood} onChange={(e) => setFilters({...filters, neighborhood: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Código do pacote" value={filters.code} onChange={(e) => setFilters({...filters, code: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Destinatário" value={filters.recipient} onChange={(e) => setFilters({...filters, recipient: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button onClick={loadPackages} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Filtrar</button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3 font-medium">Código</th>
                    <th className="p-3 font-medium">Destinatário</th>
                    <th className="p-3 font-medium">Endereço</th>
                    <th className="p-3 font-medium">Bairro</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(pkg)}>
                      <td className="p-3 font-mono text-xs">{pkg.code}</td>
                      <td className="p-3">{pkg.recipient}</td>
                      <td className="p-3 text-gray-500 max-w-[200px] truncate">{pkg.address}</td>
                      <td className="p-3">{pkg.neighborhood}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[pkg.status]}`}>
                          {statusLabels[pkg.status]}
                        </span>
                      </td>
                      <td className="p-3">
                        {pkg.status === 'absent' && (
                          <button onClick={(e) => { e.stopPropagation(); handleReturnStock(pkg.id); }} className="text-xs text-primary-600 hover:underline">
                            Retornar ao estoque
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {packages.length === 0 && <p className="p-6 text-center text-gray-400">Nenhum pacote encontrado</p>}
          </div>

          {selected && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Detalhes do Pacote</h3>
                <div className="space-y-3 text-sm">
                  <div><strong>Código:</strong> {selected.code}</div>
                  <div><strong>Destinatário:</strong> {selected.recipient}</div>
                  <div><strong>Endereço:</strong> {selected.address}</div>
                  <div><strong>Bairro:</strong> {selected.neighborhood}</div>
                  <div><strong>Cidade:</strong> {selected.city}</div>
                  <div><strong>CEP:</strong> {selected.zip_code}</div>
                  <div><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selected.status]}`}>{statusLabels[selected.status]}</span></div>
                  <div><strong>Observações:</strong> {selected.observations || '-'}</div>
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
