'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Stat, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Metric, Server } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canWrite } = useUser();
  const server = useFetch<Server>(`/servers/${id}`);
  // Rafraîchissement toutes les 15 s pour suivre les mesures périodiques
  const metrics = useFetch<Metric[]>(`/monitoring/servers/${id}/metrics?hours=3&limit=180`, 15_000);
  const uptime = useFetch<{ uptimePercent: number | null; samples: number }>(
    `/monitoring/servers/${id}/uptime?hours=24`,
    60_000,
  );

  const rows = (metrics.data ?? []).map((m) => ({
    time: new Date(m.recordedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    CPU: Math.round(m.cpuUsage * 10) / 10,
    RAM: Math.round(m.ramUsage * 10) / 10,
    Disque: Math.round(m.diskUsage * 10) / 10,
  }));
  const last = metrics.data?.[metrics.data.length - 1];

  async function setStatus(status: string) {
    await api(`/servers/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    server.reload();
  }

  return (
    <>
      <p><Link href="/servers">← Serveurs</Link></p>
      <State loading={server.loading} error={server.error}>
        {server.data && (
          <>
            <h1>
              {server.data.name} <Badge value={server.data.status} />
            </h1>
            <p className="muted">
              {server.data.provider} · {server.data.region} · {server.data.ipAddress} · {server.data.cpuCores} vCPU ·{' '}
              {server.data.ramGb} Go RAM · {server.data.storageGb} Go
            </p>
            {canWrite && (
              <div className="toolbar">
                <span className="muted">Changer le statut :</span>
                {['ONLINE', 'OFFLINE', 'MAINTENANCE'].map((s) => (
                  <button key={s} disabled={server.data!.status === s} onClick={() => setStatus(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="grid cols-4" style={{ marginBottom: 16 }}>
              <Stat label="CPU actuel" value={last ? `${last.cpuUsage.toFixed(1)} %` : '—'} />
              <Stat label="RAM actuelle" value={last ? `${last.ramUsage.toFixed(1)} %` : '—'} />
              <Stat label="Disque" value={last ? `${last.diskUsage.toFixed(1)} %` : '—'} />
              <Stat
                label="Disponibilité 24 h"
                value={uptime.data?.uptimePercent != null ? `${uptime.data.uptimePercent} %` : '—'}
              />
            </div>

            <div className="card">
              <h2>Historique CPU / RAM / Disque (3 dernières heures)</h2>
              <State loading={metrics.loading} error={metrics.error}>
                {rows.length === 0 ? (
                  <p className="muted">Pas encore de mesures : la première collecte a lieu dans la minute.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={rows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" minTickGap={30} />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="CPU" stroke="#2459d6" dot={false} />
                      <Line type="monotone" dataKey="RAM" stroke="#16a34a" dot={false} />
                      <Line type="monotone" dataKey="Disque" stroke="#d97706" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </State>
            </div>

            <div className="card">
              <h2>Applications hébergées</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nom</th><th>Version</th><th>Environnement</th><th>Statut</th></tr></thead>
                  <tbody>
                    {server.data.applications?.map((a) => (
                      <tr key={a.id}>
                        <td>{a.name}</td>
                        <td>{a.version}</td>
                        <td>{a.environment?.name} ({a.environment?.type})</td>
                        <td><Badge value={a.status} /></td>
                      </tr>
                    ))}
                    {!server.data.applications?.length && (
                      <tr><td colSpan={4} className="muted">Aucune application.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </State>
    </>
  );
}
