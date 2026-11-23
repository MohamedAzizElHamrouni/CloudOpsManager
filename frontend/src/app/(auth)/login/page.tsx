'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { session } from '@/lib/auth';
import type { User } from '@/lib/types';
import { ErrorBox } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
      });
      session.set(res.accessToken, res.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center">
      <div className="card auth-card">
        <h1>CloudOps Manager</h1>
        <p className="muted">Connexion</p>
        <ErrorBox message={error} />
        <form onSubmit={onSubmit}>
          <input name="email" type="email" placeholder="Email" required defaultValue="admin@cloudops.io" />
          <input name="password" type="password" placeholder="Mot de passe" required minLength={8} />
          <button className="primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="muted">
          Pas de compte ? <Link href="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
