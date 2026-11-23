const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Client API typé : ajoute le JWT et normalise les erreurs (états chargement/erreur côté UI). */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(res.status, msg ?? 'Erreur réseau');
  }
  return res.json() as Promise<T>;
}
