'use client';
import { useState } from 'react';
import { Badge, Pager, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Paginated, User } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function UsersPage() {
  const { user: me, isAdmin, ready } = useUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const qs = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) qs.set('search', search);
  // La route est réservée aux ADMIN côté API ; on évite l'appel pour les autres rôles
  const { data, loading, error, reload } = useFetch<Paginated<User>>(ready && isAdmin ? `/users?${qs}` : null);

  if (ready && !isAdmin) return <div className="error">Accès réservé aux administrateurs.</div>;

  async function setRole(id: string, role: string) {
    try {
      await api(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    }
  }

  async function toggleActive(u: User) {
    await api(`/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !u.isActive }) });
    reload();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <>
      <h1>Utilisateurs</h1>
      <div className="toolbar">
        <input placeholder="Rechercher…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <div className="card">
        <State loading={loading} error={error}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Actif</th><th /></tr></thead>
              <tbody>
                {data?.data.map((u) => (
                  <tr key={u.id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.id === me?.id ? (
                        <Badge value={u.role} />
                      ) : (
                        <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                          <option>ADMIN</option><option>DEVOPS</option><option>VIEWER</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <input type="checkbox" checked={!!u.isActive} disabled={u.id === me?.id} onChange={() => toggleActive(u)} />
                    </td>
                    <td>{u.id !== me?.id && <button className="danger" onClick={() => remove(u.id)}>Supprimer</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager meta={data?.meta} onPage={setPage} />
        </State>
      </div>
    </>
  );
}
