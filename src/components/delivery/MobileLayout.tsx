'use client';
import Link from 'next/link';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/app/routes" className="font-bold text-lg">Graxalog</Link>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }}
          className="text-xs bg-primary-700 px-3 py-1.5 rounded"
        >
          Sair
        </button>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
