'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { session } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(session.user() ? '/dashboard' : '/login');
  }, [router]);
  return <p className="muted" style={{ padding: 24 }}>Redirection…</p>;
}
