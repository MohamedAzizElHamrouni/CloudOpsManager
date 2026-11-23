'use client';
import { FormEvent, useState } from 'react';
import { Badge, ErrorBox, Pager, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Application, Environment, Paginated, Project, Server } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

const STATUSES = ['RUNNING', 'STOPPED', 'FAILED', 'DEPLOYING'];

export default function ApplicationsPage() {
  const { canWrite } = useUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [projectId, setProjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) qs.set('search', search);
  if (status) qs.set('status', status);
  const { data, loading, error, reload } = useFetch<Paginated<Application>>(`/applications?${qs}`);
  const projects = useFetch<Paginated<Project>>('/projects?limit=100');
  const servers = useFetch<Paginated<Server>>('/servers?limit=100');
  // Les environnements dépendent du projet choisi dans le formulaire
  const envs = useFetch<Environment[]>(projectId ? `/projects/${projectId}/environments` : null);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!f.repoUrl) delete f.repoUrl;
    try {
      await api('/applications', { method: 'POST', body: JSON.stringify(f) });
      form.reset();
      setProjectId('');
      setFormError(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function changeStatus(id: string, newStatus: string) {
    await api(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    reload();
  }

  async function onDelete(id: string) {
    if (!confirm('Supprimer cette application ?')) return;
    await api(`/applications/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <>
      <h1>Applications</h1>
      <div className="toolbar">
        <input placeholder="Rechercher…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {canWrite && (
        <form className="card form" onSubmit={onCreate}>
          <label>Nom<input name="name" required /></label>
          <label>Version<input name="version" placeholder="1.0.0" required /></label>
          <label>
            Projet
            <select name="projectId" required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— Choisir —</option>
              {projects.data?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>
            Environnement
            <select name="environmentId" required disabled={!projectId}>
              <option value="">— Choisir —</option>
              {envs.data?.map((en) => <option key={en.id} value={en.id}>{en.name} ({en.type})</option>)}
            </select>
          </label>
          <label>
            Serveur
            <select name="serverId" required>
              <option value="">— Choisir —</option>
              {servers.data?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>Dépôt (optionnel)<input name="repoUrl" /></label>
          <button className="primary">+ Déployer</button>
          <div style={{ gridColumn: '1 / -1' }}><ErrorBox message={formError} /></div>
        </form>
      )}

      <div className="card">
        <State loading={loading} error={error}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Version</th><th>Projet</th><th>Environnement</th><th>Serveur</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {data?.data.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.version}</td>
                    <td>{a.project?.name}</td>
                    <td>{a.environment?.name} ({a.environment?.type})</td>
                    <td>{a.server?.name}</td>
                    <td>
                      {canWrite ? (
                        <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}>
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <Badge value={a.status} />
                      )}
                    </td>
                    <td>{canWrite && <button className="danger" onClick={() => onDelete(a.id)}>Supprimer</button>}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && <tr><td colSpan={7} className="muted">Aucune application.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager meta={data?.meta} onPage={setPage} />
        </State>
      </div>
    </>
  );
}
