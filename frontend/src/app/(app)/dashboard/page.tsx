'use client';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge, Stat, State } from '@/components/ui';
import type { DashboardSummary, Paginated, Project } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

const STATUS_COLORS: Record<string, string> = { ONLINE: '#16a34a', OFFLINE: '#dc2626', MAINTENANCE: '#d97706' };
const SEV_COLORS: Record<string, string> = { INFO: '#2459d6', WARNING: '#d97706', CRITICAL: '#dc2626' };

export default function DashboardPage() {
  const [projectId, setProjectId] = useState('');
  const projects = useFetch<Paginated<Project>>('/projects?limit=100');
  const { data, loading, error } = useFetch<DashboardSummary>(
    `/dashboard/summary${projectId ? `?projectId=${projectId}` : ''}`,
    30_000,
  );

  const serverPie = Object.entries(data?.serversByStatus ?? {}).map(([name, value]) => ({ name, value }));
  const sevBars = ['INFO', 'WARNING', 'CRITICAL'].map((s) => ({ name: s, alertes: data?.openAlertsBySeverity?.[s] ?? 0 }));
  const usage = [
    { name: 'CPU', valeur: data?.averageUsage.cpu ?? 0 },
    { name: 'RAM', valeur: data?.averageUsage.ram ?? 0 },
    { name: 'Disque', valeur: data?.averageUsage.disk ?? 0 },
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <div className="toolbar">
        <label className="muted">Projet :</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Tous les projets</option>
          {projects.data?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <State loading={loading} error={error}>
        {data && (
          <>
            <div className="grid cols-4" style={{ marginBottom: 16 }}>
              <Stat label="Projets" value={data.totals.projects} />
              <Stat label="Serveurs" value={data.totals.servers} />
              <Stat label="Applications" value={data.totals.applications} />
              <Stat label="Alertes ouvertes" value={data.totals.openAlerts} />
            </div>

            <div className="grid cols-2">
              <div className="card">
                <h2>Serveurs par statut</h2>
                {serverPie.length === 0 ? (
                  <p className="muted">Aucun serveur.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={serverPie} dataKey="value" nameKey="name" outerRadius={85} label>
                        {serverPie.map((s) => (
                          <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="card">
                <h2>Alertes ouvertes par gravité</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={sevBars}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="alertes">
                      {sevBars.map((s) => (
                        <Cell key={s.name} fill={SEV_COLORS[s.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2>Utilisation moyenne (15 dernières min, %)</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="valeur" fill="#2459d6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2>Dernières alertes</h2>
                {data.recentAlerts.length === 0 ? (
                  <p className="muted">Aucune alerte pour le moment.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <tbody>
                        {data.recentAlerts.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <Badge value={a.severity} />
                            </td>
                            <td>{a.server.name}</td>
                            <td>{a.message}</td>
                            <td>
                              <Badge value={a.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </State>
    </>
  );
}
