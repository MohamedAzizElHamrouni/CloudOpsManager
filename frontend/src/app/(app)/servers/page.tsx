'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Badge, ErrorBox, Pager, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Paginated, Project, Server } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function ServersPage() {
  const { canWrite, isAdmin } = useUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) qs.set('search', search);
  if (status) qs.set('status', status);

  const { data, loading, error, reload } = useFetch<Paginated<Server>>(`/servers?${qs}`);
  const projects = useFetch<Paginated<Project>>('/projects?limit=100');

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!f.projectId) delete f.projectId;
    try {
      await api('/servers', { method: 'POST', body: JSON.stringify(f) });
      setShowForm(false);
      setFormError(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Supprimer ce serveur ?')) return;
    try {
      await api(`/servers/${id}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <>
      <h1>Serveurs</h1>
      <div className="toolbar">
        <input
          placeholder="Rechercher (nom, IP, fournisseur)…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="ONLINE">ONLINE</option>
          <option value="OFFLINE">OFFLINE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
        {canWrite && (
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Fermer' : '+ Nouveau serveur'}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={onCreate}>
          <label>Nom<input name="name" required /></label>
          <label>Fournisseur<input name="provider" placeholder="AWS, OVH, Hetzner…" required /></label>
          <label>Région<input name="region" placeholder="eu-west-1" required /></label>
          <label>CPU (cœurs)<input name="cpuCores" type="number" min={1} required /></label>
          <label>RAM (Go)<input name="ramGb" type="number" min={1} required /></label>
          <label>Stockage (Go)<input name="storageGb" type="number" min={1} required /></label>
          <label>Adresse IP<input name="ipAddress" placeholder="10.0.0.5" required /></label>
          <label>
            Statut
            <select name="status" defaultValue="ONLINE">
              <option>ONLINE</option>
              <option>OFFLINE</option>
              <option>MAINTENANCE</option>
            </select>
          </label>
          <label>
            Projet
            <select name="projectId" defaultValue="">
              <option value="">— Aucun —</option>
              {projects.data?.data.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <button className="primary">Créer</button>
          <div style={{ gridColumn: '1 / -1' }}><ErrorBox message={formError} /></div>
        </form>
      )}

      <div className="card">
        <State loading={loading} error={error}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th><th>Fournisseur</th><th>Région</th><th>Specs</th><th>IP</th><th>Projet</th><th>Statut</th><th />
                </tr>
              </thead>
              <tbody>
                {data?.data.map((s) => (
                  <tr key={s.id}>
                    <td><Link href={`/servers/${s.id}`}>{s.name}</Link></td>
                    <td>{s.provider}</td>
                    <td>{s.region}</td>
                    <td>{s.cpuCores} vCPU · {s.ramGb} Go · {s.storageGb} Go</td>
                    <td>{s.ipAddress}</td>
                    <td>{s.project?.name ?? '—'}</td>
                    <td><Badge value={s.status} /></td>
                    <td>{isAdmin && <button className="danger" onClick={() => onDelete(s.id)}>Supprimer</button>}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={8} className="muted">Aucun serveur trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager meta={data?.meta} onPage={setPage} />
        </State>
      </div>
    </>
  );
}
