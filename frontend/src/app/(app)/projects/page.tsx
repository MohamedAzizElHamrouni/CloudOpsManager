'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Badge, ErrorBox, Pager, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Paginated, Project } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function ProjectsPage() {
  const { canWrite, isAdmin } = useUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) qs.set('search', search);
  if (status) qs.set('status', status);
  const { data, loading, error, reload } = useFetch<Paginated<Project>>(`/projects?${qs}`);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    try {
      await api('/projects', { method: 'POST', body: JSON.stringify(f) });
      form.reset();
      setFormError(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Supprimer ce projet et ses environnements ?')) return;
    try {
      await api(`/projects/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <>
      <h1>Projets</h1>
      <div className="toolbar">
        <input placeholder="Rechercher…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {canWrite && (
        <form className="card form" onSubmit={onCreate}>
          <label>Nom<input name="name" required minLength={2} /></label>
          <label>Description<input name="description" /></label>
          <button className="primary">+ Créer le projet</button>
          <div style={{ gridColumn: '1 / -1' }}><ErrorBox message={formError} /></div>
        </form>
      )}

      <div className="card">
        <State loading={loading} error={error}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Description</th><th>Équipe</th><th>Serveurs</th><th>Apps</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {data?.data.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/projects/${p.id}`}>{p.name}</Link></td>
                    <td>{p.description ?? '—'}</td>
                    <td>{p._count?.members}</td>
                    <td>{p._count?.servers}</td>
                    <td>{p._count?.applications}</td>
                    <td><Badge value={p.status} /></td>
                    <td>{isAdmin && <button className="danger" onClick={() => onDelete(p.id)}>Supprimer</button>}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && <tr><td colSpan={7} className="muted">Aucun projet.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager meta={data?.meta} onPage={setPage} />
        </State>
      </div>
    </>
  );
}
