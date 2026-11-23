'use client';
import type { ReactNode } from 'react';

export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value}`}>{value}</span>;
}

export function ErrorBox({ message }: { message: string | null }) {
  return message ? <div className="error">{message}</div> : null;
}

/** Affiche chargement / erreur, sinon le contenu. */
export function State({ loading, error, children }: { loading: boolean; error: string | null; children: ReactNode }) {
  if (loading) return <p className="muted">Chargement…</p>;
  if (error) return <ErrorBox message={error} />;
  return <>{children}</>;
}

export function Pager({
  meta,
  onPage,
}: {
  meta?: { total: number; page: number; totalPages: number };
  onPage: (p: number) => void;
}) {
  if (!meta) return null;
  return (
    <div className="pager">
      <span>{meta.total} résultat(s)</span>
      <button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        ←
      </button>
      <span>
        {meta.page} / {Math.max(meta.totalPages, 1)}
      </span>
      <button disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
        →
      </button>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="card stat">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
