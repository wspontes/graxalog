'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const items = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/import', label: 'Importar Carga', icon: '📥' },
  { href: '/admin/packages', label: 'Pacotes', icon: '📦' },
  { href: '/admin/routes', label: 'Rotas', icon: '🗺️' },
  { href: '/admin/delivery-people', label: 'Entregadores', icon: '👤' },
  { href: '/admin/reports', label: 'Relatórios', icon: '📈' },
];

export default function Sidebar() {
  const path = usePathname() ?? '';
  const [open, setOpen] = useState(false);

  const sidebar = (
    <aside className={`bg-gray-900 text-white flex flex-col z-30 ${open ? 'fixed inset-0 w-full' : 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-[260px] lg:flex'}`}>
      <div className="flex items-center justify-between p-5 border-b border-gray-700">
        <div>
          <h1 className="text-lg font-bold">Graxalog</h1>
          <p className="text-xs text-gray-400 mt-1">Painel Administrativo</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
          ✕
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Link href="/" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white transition">
          Sair
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 text-white rounded-lg shadow-lg">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setOpen(false)} />}
      {sidebar}
    </>
  );
}
