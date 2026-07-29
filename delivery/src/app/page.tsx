'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.push('/routes');
    else router.push('/login');
  }, [router]);
  return null;
}
