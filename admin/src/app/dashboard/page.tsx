'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';
import { joinAdmin, onDashboardUpdate } from '@/lib/socket';

export default function DashboardPage() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    api.reports.dashboard().then(setData);
    joinAdmin();
    const unsub = onDashboardUpdate(setData);
    return unsub;
  }, []);

  const cards = [
    { label: 'Esperados', value: data.esperados_hoje || 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'Conferidos', value: data.conferidos || 0, color: 'bg-green-50 text-green-700' },
    { label: 'Pendentes Conf.', value: data.pendentes_conferencia || 0, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Em Estoque', value: data.em_estoque || 0, color: 'bg-gray-50 text-gray-700' },
    { label: 'Em Rota', value: data.em_rota || 0, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Entregues', value: data.entregues || 0, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Ausentes', value: data.ausentes || 0, color: 'bg-orange-50 text-orange-700' },
    { label: 'Terceiros', value: data.terceiros || 0, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
                <p className="text-3xl font-bold">{c.value}</p>
                <p className="text-sm mt-1 opacity-80">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white rounded-xl p-5 border">
              <h3 className="font-semibold mb-4">Rotas</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>Não iniciadas</span><span className="font-bold">{data.rotas_nao_iniciadas || 0}</span></div>
                <div className="flex justify-between"><span>Em andamento</span><span className="font-bold">{data.rotas_andamento || 0}</span></div>
                <div className="flex justify-between"><span>Concluídas</span><span className="font-bold">{data.rotas_concluidas || 0}</span></div>
                <div className="flex justify-between"><span>Parciais</span><span className="font-bold">{data.rotas_parciais || 0}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border">
              <h3 className="font-semibold mb-4">Entregas</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span>Taxa de sucesso</span><span className="font-bold text-emerald-600">
                  {((data.entregues || 0) / ((data.entregues || 0) + (data.ausentes || 0)) * 100 || 0).toFixed(1)}%
                </span></div>
                <div className="flex justify-between"><span>Total de pacotes</span><span className="font-bold">{(data.entregues || 0) + (data.ausentes || 0) + (data.terceiros || 0) + (data.em_rota || 0) + (data.em_estoque || 0)}</span></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
