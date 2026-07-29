'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/import', label: 'Importar Carga', icon: '📥' },
  { href: '/packages', label: 'Pacotes', icon: '📦' },
  { href: '/routes', label: 'Rotas', icon: '🗺️' },
  { href: '/delivery-people', label: 'Entregadores', icon: '👤' },
  { href: '/reports', label: 'Relatórios', icon: '📈' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-gray-900 text-white flex flex-col z-30">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-lg font-bold">Graxalog</h1>
        <p className="text-xs text-gray-400 mt-1">Painel Administrativo</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
          Sair
        </Link>
      </div>
    </aside>
  );
}
