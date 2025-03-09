// src/app/comptable/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import useLogin from '@/app/hooks/useLogin';

export default function ComptableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useLogin();

  useEffect(() => {
    if (!user || user.libelle_profil !== "Comptable") {
      return;
    }
  }, [user]);

  if (!user || user.libelle_profil !== "Comptable") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès Refusé</h1>
          <p className="text-gray-600">
            Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="pt-16 lg:pl-64">
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
