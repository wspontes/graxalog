'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<any>({});
  const [performance, setPerformance] = useState<any[]>([]);
  const [avgTime, setAvgTime] = useState<any[]>([]);

  useEffect(() => {
    api.reports.dashboard().then(setDashboard);
    api.reports.performance().then(setPerformance);
    api.reports.avgRouteTime().then(setAvgTime);
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Relatórios</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Desempenho por Entregador</h3>
              <div className="space-y-3">
                {performance.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center">
                    <span className="font-medium text-sm">{p.name}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-600">{p.delivered}✓</span>
                      <span className="text-orange-600">{p.absent}✗</span>
                      <span className="text-purple-600">{p.third_party}◉</span>
                      <span className="font-bold">{p.success_rate || 0}%</span>
                    </div>
                  </div>
                ))}
                {performance.length === 0 && <p className="text-sm text-gray-400">Nenhum dado disponível</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Tempo Médio por Rota (min)</h3>
              <div className="space-y-3">
                {avgTime.map((r: any) => (
                  <div key={r.name} className="flex justify-between items-center">
                    <span className="text-sm">{r.name}</span>
                    <span className="font-bold text-sm">{Math.round(r.avg_minutes)} min ({r.total_routes} rotas)</span>
                  </div>
                ))}
                {avgTime.length === 0 && <p className="text-sm text-gray-400">Nenhum dado disponível</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Resumo Geral</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Total de pacotes:</span><br /><span className="font-bold text-lg">{dashboard.esperados_hoje || 0}</span></div>
                <div><span className="text-gray-500">Entregues:</span><br /><span className="font-bold text-lg text-emerald-600">{dashboard.entregues || 0}</span></div>
                <div><span className="text-gray-500">Ausentes:</span><br /><span className="font-bold text-lg text-orange-600">{dashboard.ausentes || 0}</span></div>
                <div><span className="text-gray-500">Terceiros:</span><br /><span className="font-bold text-lg text-purple-600">{dashboard.terceiros || 0}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Exportar Dados</h3>
              <p className="text-sm text-gray-500 mb-4">Exporte a listagem de pacotes em Excel ou PDF.</p>
              <div className="flex gap-2">
                <button onClick={async () => {
                  const blob = await api.reports.export({ format: 'xlsx' });
                  if (blob) window.open('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + btoa(JSON.stringify(blob)));
                }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Exportar XLSX
                </button>
                <button onClick={async () => {
                  const data = await api.reports.export({});
                  const { default: jsPDF } = await import('jspdf');
                  const doc = new jsPDF();
                  doc.text('Relatório de Pacotes', 14, 20);
                  const rows = data.map((p: any) => [p.code, p.recipient, p.neighborhood, p.status]);
                  (doc as any).autoTable({ head: [['Código', 'Destinatário', 'Bairro', 'Status']], body: rows, startY: 30 });
                  doc.save('pacotes.pdf');
                }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
