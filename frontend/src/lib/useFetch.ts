'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';

/** Charge une route GET et expose les états chargement / erreur (rafraîchissement auto optionnel). */
export function useFetch<T>(path: string | null, intervalMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!path) return;
      if (!silent) setLoading(true);
      try {
        setData(await api<T>(path));
        setError(null);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    },
    [path],
  );

  useEffect(() => {
    load();
    if (!intervalMs || !path) return;
    const t = setInterval(() => load(true), intervalMs);
    return () => clearInterval(t);
  }, [load, intervalMs, path]);

  return { data, loading, error, reload: () => load(true) };
}
