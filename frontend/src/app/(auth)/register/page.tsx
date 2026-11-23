'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { session } from '@/lib/auth';
import type { User } from '@/lib/types';
import { ErrorBox } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ accessToken: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(f)),
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
        <h1>Créer un compte</h1>
        <p className="muted">Les nouveaux comptes ont le rôle Viewer. Un Admin peut les promouvoir.</p>
        <ErrorBox message={error} />
        <form onSubmit={onSubmit}>
          <input name="firstName" placeholder="Prénom" required />
          <input name="lastName" placeholder="Nom" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Mot de passe (8+ caractères)" required minLength={8} />
          <button className="primary" disabled={loading}>
            {loading ? 'Création…' : "S'inscrire"}
          </button>
        </form>
        <p className="muted">
          Déjà un compte ? <Link href="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
