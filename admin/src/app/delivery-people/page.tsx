'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { api } from '@/lib/api';

export default function DeliveryPeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', phone: '', login: '', password: '' });
  const [selected, setSelected] = useState<any>(null);
  const [resetPwd, setResetPwd] = useState({ id: 0, newPassword: '' });

  useEffect(() => { loadPeople(); }, []);

  function loadPeople() { api.deliveryPeople.list().then(setPeople); }

  async function handleCreate() {
    await api.deliveryPeople.create(newPerson);
    setShowCreate(false);
    setNewPerson({ name: '', phone: '', login: '', password: '' });
    loadPeople();
  }

  async function handleToggleActive(id: number, active: boolean) {
    await api.deliveryPeople.update(id, { active: !active });
    loadPeople();
  }

  async function handleResetPassword() {
    if (!resetPwd.newPassword) return;
    await api.deliveryPeople.resetPassword(resetPwd.id, resetPwd.newPassword);
    setResetPwd({ id: 0, newPassword: '' });
    alert('Senha redefinida com sucesso!');
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-[260px]">
        <Header />
        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Entregadores</h2>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              + Novo Entregador
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <div key={p.id} className={`bg-white rounded-xl border p-4 ${!p.active ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.login}</p>
                    <p className="text-sm text-gray-500">{p.phone || 'Sem telefone'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setSelected(p)} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Detalhes</button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleToggleActive(p.id, p.active)} className={`text-xs px-2 py-1 rounded ${p.active ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {p.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => setResetPwd({ id: p.id, newPassword: '' })} className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded">
                    Redefinir Senha
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Novo Entregador</h3>
                <div className="space-y-3">
                  <input placeholder="Nome" value={newPerson.name} onChange={(e) => setNewPerson({...newPerson, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input placeholder="Telefone" value={newPerson.phone} onChange={(e) => setNewPerson({...newPerson, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input placeholder="Login" value={newPerson.login} onChange={(e) => setNewPerson({...newPerson, login: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <input type="password" placeholder="Senha" value={newPerson.password} onChange={(e) => setNewPerson({...newPerson, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleCreate} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">Criar</button>
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {resetPwd.id > 0 && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Redefinir Senha</h3>
                <input type="password" placeholder="Nova senha" value={resetPwd.newPassword} onChange={(e) => setResetPwd({...resetPwd, newPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <div className="flex gap-2 mt-4">
                  <button onClick={handleResetPassword} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm">Salvar</button>
                  <button onClick={() => setResetPwd({ id: 0, newPassword: '' })} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
