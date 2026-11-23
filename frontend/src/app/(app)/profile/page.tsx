'use client';
import { FormEvent, useState } from 'react';
import { Badge, ErrorBox, State } from '@/components/ui';
import { api } from '@/lib/api';
import { session } from '@/lib/auth';
import type { User } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function ProfilePage() {
  const { data, loading, error, reload } = useFetch<User>('/users/me');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const updated = await api<User>('/users/me', { method: 'PATCH', body: JSON.stringify(f) });
      const token = localStorage.getItem('token') ?? '';
      session.set(token, { ...session.user()!, firstName: updated.firstName, lastName: updated.lastName });
      setMsg('Profil mis à jour.');
      setErr(null);
      reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Erreur');
      setMsg(null);
    }
  }

  return (
    <>
      <h1>Mon profil</h1>
      <State loading={loading} error={error}>
        {data && (
          <form className="card form" style={{ maxWidth: 520 }} onSubmit={onSave} key={data.firstName + data.lastName}>
            <label>Prénom<input name="firstName" defaultValue={data.firstName} required /></label>
            <label>Nom<input name="lastName" defaultValue={data.lastName} required /></label>
            <label>Email<input value={data.email} disabled readOnly /></label>
            <label>Rôle<span><Badge value={data.role} /></span></label>
            <button className="primary">Enregistrer</button>
            <div style={{ gridColumn: '1 / -1' }}>
              <ErrorBox message={err} />
              {msg && <span className="muted">{msg}</span>}
            </div>
          </form>
        )}
      </State>
    </>
  );
}
