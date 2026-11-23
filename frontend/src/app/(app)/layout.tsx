'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { session, useUser } from '@/lib/auth';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projets' },
  { href: '/servers', label: 'Serveurs' },
  { href: '/applications', label: 'Applications' },
  { href: '/alerts', label: 'Alertes' },
  { href: '/profile', label: 'Profil' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, isAdmin } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (!ready || !user) return <p className="muted" style={{ padding: 24 }}>Chargement…</p>;

  const nav = isAdmin ? [...links.slice(0, 5), { href: '/users', label: 'Utilisateurs' }, links[5]] : links;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          ☁ CloudOps
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
            ☰
          </button>
        </div>
        <nav className={open ? 'open' : ''}>
          {nav.map((l) => (
            <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? 'active' : ''}>
              {l.label}
            </Link>
          ))}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              session.clear();
              router.replace('/login');
            }}
          >
            Déconnexion
          </a>
        </nav>
        <div className="who">
          {user.firstName} {user.lastName}
          <br />
          {user.role}
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
