'use client';
import { FormEvent, useState } from 'react';
import { Badge, ErrorBox, Pager, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Alert, AlertRule, Paginated, Server } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

const OPS: Record<string, string> = { GT: '>', GTE: '≥', LT: '<', LTE: '≤' };

export default function AlertsPage() {
  const { canWrite } = useUser();
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');

  return (
    <>
      <h1>Alertes</h1>
      <div className="tabs">
        <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>Incidents</button>
        <button className={tab === 'rules' ? 'active' : ''} onClick={() => setTab('rules')}>Règles et seuils</button>
      </div>
      {tab === 'alerts' ? <AlertsList canWrite={!!canWrite} /> : <RulesList canWrite={!!canWrite} />}
    </>
  );
}

function AlertsList({ canWrite }: { canWrite: boolean }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const qs = new URLSearchParams({ page: String(page), limit: '10' });
  if (status) qs.set('status', status);
  if (severity) qs.set('severity', severity);
  const { data, loading, error, reload } = useFetch<Paginated<Alert>>(`/alerts?${qs}`, 20_000);

  async function act(id: string, action: 'acknowledge' | 'resolve') {
    await api(`/alerts/${id}/${action}`, { method: 'PATCH' });
    reload();
  }

  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          <option>OPEN</option><option>ACKNOWLEDGED</option><option>RESOLVED</option>
        </select>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
          <option value="">Toutes les gravités</option>
          <option>INFO</option><option>WARNING</option><option>CRITICAL</option>
        </select>
      </div>
      <div className="card">
        <State loading={loading} error={error}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Gravité</th><th>Serveur</th><th>Message</th><th>Déclenchée</th><th>Résolue</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {data?.data.map((a) => (
                  <tr key={a.id}>
                    <td><Badge value={a.severity} /></td>
                    <td>{a.server.name}</td>
                    <td>{a.message}</td>
                    <td>{new Date(a.triggeredAt).toLocaleString('fr-FR')}</td>
                    <td>{a.resolvedAt ? new Date(a.resolvedAt).toLocaleString('fr-FR') : '—'}</td>
                    <td><Badge value={a.status} /></td>
                    <td>
                      {canWrite && a.status === 'OPEN' && <button onClick={() => act(a.id, 'acknowledge')}>Acquitter</button>}{' '}
                      {canWrite && a.status !== 'RESOLVED' && <button onClick={() => act(a.id, 'resolve')}>Résoudre</button>}
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && <tr><td colSpan={7} className="muted">Aucune alerte.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager meta={data?.meta} onPage={setPage} />
        </State>
      </div>
    </>
  );
}

function RulesList({ canWrite }: { canWrite: boolean }) {
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, error, reload } = useFetch<Paginated<AlertRule>>(`/alert-rules?page=${page}&limit=10`);
  const servers = useFetch<Paginated<Server>>('/servers?limit=100');

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!f.serverId) delete f.serverId;
    try {
      await api('/alert-rules', { method: 'POST', body: JSON.stringify({ ...f, threshold: Number(f.threshold) }) });
      form.reset();
      setFormError(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function toggle(r: AlertRule) {
    await api(`/alert-rules/${r.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !r.enabled }) });
    reload();
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette règle ?')) return;
    await api(`/alert-rules/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <>
      {canWrite && (
        <form className="card form" onSubmit={onCreate}>
          <label>Nom<input name="name" required placeholder="CPU élevé" /></label>
          <label>
            Métrique
            <select name="metric"><option>CPU</option><option>RAM</option><option>DISK</option></select>
          </label>
          <label>
            Opérateur
            <select name="operator" defaultValue="GT">
              {Object.entries(OPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Seuil (%)<input name="threshold" type="number" min={0} max={100} step="0.1" required /></label>
          <label>
            Gravité
            <select name="severity" defaultValue="WARNING"><option>INFO</option><option>WARNING</option><option>CRITICAL</option></select>
          </label>
          <label>
            Serveur
            <select name="serverId" defaultValue="">
              <option value="">Tous (règle globale)</option>
              {servers.data?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button className="primary">+ Ajouter</button>
          <div style={{ gridColumn: '1 / -1' }}><ErrorBox message={formError} /></div>
        </form>
      )}
      <div className="card">
        <State loading={loading} error={error}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Condition</th><th>Gravité</th><th>Portée</th><th>Active</th><th /></tr></thead>
              <tbody>
                {data?.data.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.metric} {OPS[r.operator]} {r.threshold} %</td>
                    <td><Badge value={r.severity} /></td>
                    <td>{r.server?.name ?? 'Tous les serveurs'}</td>
                    <td>
                      <input type="checkbox" checked={r.enabled} disabled={!canWrite} onChange={() => toggle(r)} />
                    </td>
                    <td>{canWrite && <button className="danger" onClick={() => remove(r.id)}>Supprimer</button>}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && <tr><td colSpan={6} className="muted">Aucune règle.</td></tr>}
              </tbody>
            </table>
          </div>
          <Pager meta={data?.meta} onPage={setPage} />
        </State>
      </div>
    </>
  );
}
