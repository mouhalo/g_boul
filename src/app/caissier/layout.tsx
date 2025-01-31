// src/app/caissier/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import useLogin from '@/app/hooks/useLogin';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function CaissierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useLogin();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.libelle_profil !== 'Caissier') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user || user.libelle_profil !== "Caissier") {
      return;
    }
  }, [user]);

  if (!user || user.libelle_profil !== 'Caissier') {
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
