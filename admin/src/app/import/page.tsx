'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function ImportPage() {
  const [tab, setTab] = useState<'file' | 'manual' | 'conference'>('file');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [conferenceStatus, setConferenceStatus] = useState<any>(null);
  const [qrInput, setQrInput] = useState('');
  const [divergentModal, setDivergentModal] = useState(false);
  const [divergentData, setDivergentData] = useState<any>({ qrCodeData: '', recipient: '', address: '' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.import.conferenceStatus();
      setConferenceStatus(s);
    } catch {}
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await api.import.file(fd);
      setMessage(`${result.count} pacotes importados com sucesso!`);
      fetchStatus();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleConference() {
    if (!qrInput.trim()) return;
    try {
      await api.import.conference(qrInput.trim());
      setQrInput('');
      setMessage('Pacote conferido com sucesso!');
      fetchStatus();
    } catch (err: any) {
      if (err.message.includes('codigo_nao_encontrado')) {
        setDivergentData({ ...divergentData, qrCodeData: qrInput.trim() });
        setDivergentModal(true);
      } else if (err.message.includes('pacote_ja_conferido')) {
        setMessage('Este pacote já foi conferido.');
      } else {
        setMessage(`Erro: ${err.message}`);
      }
    }
  }

  async function handleAddDivergent() {
    try {
      await api.import.divergent(divergentData);
      setDivergentModal(false);
      setMessage('Pacote avulso adicionado com sucesso!');
      fetchStatus();
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Importar Carga</h2>

          <div className="flex gap-2 mb-6">
            {(['file', 'manual', 'conference'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'file' ? 'Importar Arquivo' : t === 'manual' ? 'Cadastro Manual' : 'Conferência (QR)'}
              </button>
            ))}
          </div>

          {message && (
            <div className="p-3 mb-4 bg-blue-50 text-blue-700 rounded-lg text-sm">{message}</div>
          )}

          {tab === 'file' && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Importar XLSX ou PDF</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {loading && <p className="text-sm text-gray-500 mt-2">Processando...</p>}
            </div>
          )}

          {tab === 'manual' && <ManualImportForm onDone={() => { setMessage('Pacotes cadastrados!'); fetchStatus(); }} />}

          {tab === 'conference' && (
            <div className="space-y-4">
              {conferenceStatus && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold">{conferenceStatus.total_esperado}</p>
                    <p className="text-sm text-gray-500">Esperados</p>
                  </div>
                  <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{conferenceStatus.total_conferido}</p>
                    <p className="text-sm text-gray-500">Conferidos</p>
                  </div>
                  <div className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{conferenceStatus.total_pendente}</p>
                    <p className="text-sm text-gray-500">Pendentes</p>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Leitura de QR Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Escaneie ou digite o código do QR..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    autoFocus
                  />
                  <button onClick={handleConference} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    Registrar
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Modo contínuo — digite ou escaneie e pressione Enter</p>
              </div>
            </div>
          )}

          {divergentModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Pacote não encontrado no romaneio</h3>
                <p className="text-sm text-gray-600 mb-4">Este código não consta na lista importada. Deseja cadastrá-lo como pacote avulso?</p>
                <div className="space-y-3">
                  <input value={divergentData.qrCodeData} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
                  <input placeholder="Destinatário" value={divergentData.recipient} onChange={(e) => setDivergentData({...divergentData, recipient: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input placeholder="Endereço" value={divergentData.address} onChange={(e) => setDivergentData({...divergentData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleAddDivergent} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">Adicionar</button>
                  <button onClick={() => setDivergentModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">Descartar</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ManualImportForm({ onDone }: { onDone: () => void }) {
  const [packages, setPackages] = useState([{ code: '', recipient: '', address: '', neighborhood: '', city: '', zip_code: '' }]);
  const [loading, setLoading] = useState(false);

  function addRow() {
    setPackages([...packages, { code: '', recipient: '', address: '', neighborhood: '', city: '', zip_code: '' }]);
  }

  function updateRow(i: number, field: string, value: string) {
    const updated = [...packages];
    (updated[i] as any)[field] = value;
    setPackages(updated);
  }

  function removeRow(i: number) {
    setPackages(packages.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await api.import.manual({ packages: packages.filter(p => p.code) });
      onDone();
      setPackages([{ code: '', recipient: '', address: '', neighborhood: '', city: '', zip_code: '' }]);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold mb-4">Cadastro Manual de Pacotes</h3>
      <div className="space-y-3">
        {packages.map((p, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2">
              <input placeholder="Código" value={p.code} onChange={(e) => updateRow(i, 'code', e.target.value)} className="px-2 py-1.5 border rounded text-sm" />
              <input placeholder="Destinatário" value={p.recipient} onChange={(e) => updateRow(i, 'recipient', e.target.value)} className="px-2 py-1.5 border rounded text-sm" />
              <input placeholder="Endereço" value={p.address} onChange={(e) => updateRow(i, 'address', e.target.value)} className="px-2 py-1.5 border rounded text-sm" />
              <input placeholder="Bairro" value={p.neighborhood} onChange={(e) => updateRow(i, 'neighborhood', e.target.value)} className="px-2 py-1.5 border rounded text-sm" />
              <input placeholder="Cidade" value={p.city} onChange={(e) => updateRow(i, 'city', e.target.value)} className="px-2 py-1.5 border rounded text-sm" />
              <input placeholder="CEP" value={p.zip_code} onChange={(e) => updateRow(i, 'zip_code', e.target.value)} className="px-2 py-1.5 border rounded text-sm" />
            </div>
            <button onClick={() => removeRow(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded mt-1">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={addRow} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">+ Adicionar linha</button>
        <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar pacotes'}
        </button>
      </div>
    </div>
  );
}
