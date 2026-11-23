'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Badge, ErrorBox, State } from '@/components/ui';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import type { Project } from '@/lib/types';
import { useFetch } from '@/lib/useFetch';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { canWrite } = useUser();
  const { data: project, loading, error, reload } = useFetch<Project>(`/projects/${id}`);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(path: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (!body.url) delete body.url;
    try {
      await api(path, { method: 'POST', body: JSON.stringify(body) });
      form.reset();
      setFormError(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  async function remove(path: string) {
    try {
      await api(path, { method: 'DELETE' });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <>
      <p><Link href="/projects">← Projets</Link></p>
      <State loading={loading} error={error}>
        {project && (
          <>
            <h1>{project.name} <Badge value={project.status} /></h1>
            <p className="muted">{project.description}</p>
            <ErrorBox message={formError} />

            <div className="grid cols-2">
              <div className="card">
                <h2>Environnements</h2>
                <div className="table-wrap">
                  <table>
                    <tbody>
                      {project.environments?.map((env) => (
                        <tr key={env.id}>
                          <td>{env.name}</td>
                          <td><Badge value={env.type} /></td>
                          <td>{env.url ?? '—'}</td>
                          <td>
                            {canWrite && (
                              <button className="danger" onClick={() => remove(`/projects/${id}/environments/${env.id}`)}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!project.environments?.length && <tr><td className="muted">Aucun environnement.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {canWrite && (
                  <form className="form" style={{ marginTop: 12 }} onSubmit={(e) => submit(`/projects/${id}/environments`, e)}>
                    <label>Nom<input name="name" required minLength={2} /></label>
                    <label>
                      Type
                      <select name="type"><option>DEV</option><option>STAGING</option><option>PROD</option></select>
                    </label>
                    <label>URL<input name="url" placeholder="https://…" /></label>
                    <button className="primary">Ajouter</button>
                  </form>
                )}
              </div>

              <div className="card">
                <h2>Équipe et affectations</h2>
                <div className="table-wrap">
                  <table>
                    <tbody>
                      {project.members?.map((m) => (
                        <tr key={m.id}>
                          <td>{m.user.firstName} {m.user.lastName}</td>
                          <td>{m.user.email}</td>
                          <td><Badge value={m.role} /></td>
                          <td>
                            {canWrite && (
                              <button className="danger" onClick={() => remove(`/projects/${id}/members/${m.user.id}`)}>×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {canWrite && (
                  <form className="form" style={{ marginTop: 12 }} onSubmit={(e) => submit(`/projects/${id}/members`, e)}>
                    <label>Email<input name="email" type="email" required /></label>
                    <label>
                      Rôle
                      <select name="role"><option>MEMBER</option><option>OWNER</option></select>
                    </label>
                    <button className="primary">Affecter</button>
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </State>
    </>
  );
}
