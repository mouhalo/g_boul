// src/app/manager/layout.tsx
'use client';

import { useState, useEffect, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserContext } from '../contexts/UserContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useContext(UserContext);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    console.log('=== Manager Layout User Check ===');
    console.log('User:', user ? JSON.stringify(user, null, 2) : 'Not logged in');
    console.log('Profile:', user?.libelle_profil);

    if (!user || user.libelle_profil !== "Manager") {
      console.log('Redirecting to login - Invalid access');
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Chargement...</h1>
        </div>
      </div>
    );
  }

  if (!user || user.libelle_profil !== "Manager") {
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
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-4 mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
