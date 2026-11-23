'use client';
import { useEffect, useState } from 'react';
import type { User } from './types';

const TOKEN = 'token';
const USER = 'user';

export const session = {
  set(token: string, user: User) {
    localStorage.setItem(TOKEN, token);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(USER);
  },
  user(): User | null {
    try {
      const raw = localStorage.getItem(USER);
      return raw && localStorage.getItem(TOKEN) ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
};

/** Utilisateur connecté (null tant que le localStorage n'est pas lu côté client). */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(session.user());
    setReady(true);
  }, []);
  const canWrite = user?.role === 'ADMIN' || user?.role === 'DEVOPS';
  const isAdmin = user?.role === 'ADMIN';
  return { user, ready, canWrite, isAdmin };
}
