// Fichier: g_boul/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from './providers/UserProvider';
import { ParamsProvider } from './contexts/ParamsContext';
import { ToastProvider } from '@/components/ui/toast';

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
            <ToastProvider>
              {children}
            </ToastProvider>
          </ParamsProvider>
        </UserProvider>
      </body>
    </html>
  );
}