import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'CloudOps Manager',
  description: 'Supervision de projets, serveurs et applications cloud',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
