// src/app/contexts/UserContext.tsx
'use client';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface Site {
  id_site: number;
  nom_site: string;
  code_site: string;
  adresse: string;
  actif: boolean;
  tel: string;
}

export interface User {
  id_agent: number;
  id_site: number;
  bakeryId: number;
  bakeryName: string;
  sites: Site[] | null;
  nom_agent: string;
  tel_agent: string;
  login_agent: string;
  libelle_profil: string;
  id_type_agent: number;
  agent_actif: boolean;
  code_site: string;
  adresse: string;
  site_actif: boolean;
  nom_site: string;
  tel_site: string;
  nom_gerant: string;
}

interface UserContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const UserContext = createContext<UserContextProps>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Déplacer l'initialisation dans un useEffect pour éviter les problèmes d'hydratation
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
