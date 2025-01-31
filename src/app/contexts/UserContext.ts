import { createContext } from 'react';
import { Site, Article, Client, Parameter } from '@/types/parameters';

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
  parameters?: {
    articles?: Article[];
    clients?: Client[];
    typesVente?: Parameter[];
    typesClient?: Parameter[];
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {}
});
