'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Header() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.name || 'Carregando...'}</span>
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
          {user?.name?.charAt(0) || 'A'}
        </div>
      </div>
    </header>
  );
}
