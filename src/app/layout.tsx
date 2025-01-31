// Fichier: g_boul/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from './providers/UserProvider';
import { ParamsProvider } from './contexts/ParamsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'G-Boul - Gestion de Boulangerie',
  description: 'Application de gestion de boulangerie',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <UserProvider>
          <ParamsProvider>
            {children}
          </ParamsProvider>
        </UserProvider>
      </body>
    </html>
  );
}