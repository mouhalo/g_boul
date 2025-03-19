'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { envoyerRequeteApi, ApiError } from '../apis/api';
import { UserContext, User } from '../contexts/UserContext';
import { ParamsContext } from '../contexts/ParamsContext';
import { Site } from '@/types/parameters';

interface Agent {
  id: number;
  name: string;
  login: string;
  phone: string;
  roleId: number;
  role: string;
  isActive: boolean;
  siteId: number;
}

interface ApiSite {
  id_site: number;
  nom_site: string;
  code_site: string;
  adresse: string;
  actif: boolean;
  tel: string;
  les_agents: Agent[] | null;
}

interface Bakery {
  id_boul: number;
  nom_commercial: string;
  sigle: string;
  nom_gerant: string;
  adresse: string;
  tel_gerant: string;
  actif: boolean;
  email: string;
  control_stock: boolean;
  annee_encours: string;
  les_sites: ApiSite[] | null;
}

interface ConnexionAgentResponse {
  connexion_agent: {
    code: string;
    entete: string;
    la_boulangerie: Bakery[] | null;
    agent_connecte: {
      id_agent: number;
      id_site: number;
      id_boul: number;
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
    }[];
  };
}

export default function useLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser } = useContext(UserContext);
  const { loadParams, params, setParams } = useContext(ParamsContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (pendingRedirect && pathname !== pendingRedirect) {
      router.push(pendingRedirect);
    } else if (pendingRedirect && pathname === pendingRedirect) {
      setLoading(false);
      setPendingRedirect(null);
    }
  }, [pathname, pendingRedirect, router]);

  const handleLogin = async (formData: {
    code_boulangerie: string;
    login: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);
    setPendingRedirect(null);

    try {
      if (!formData.code_boulangerie.trim()) {
        setError("Le code de la boulangerie est requis.");
        setLoading(false);
        return;
      }
      const scode_unique = formData.code_boulangerie.trim().toUpperCase();

      const query = `
        SELECT * 
        FROM public.connexion_agent(
          '${scode_unique}', 
          '${formData.login}', 
          '${formData.password}'
        );
      `;
      console.log('Requete connnexion agent:',query)
      const response = await envoyerRequeteApi('boulangerie', query) as ConnexionAgentResponse[];

      if (response && response.length > 0) {
        const { connexion_agent } = response[0];
        console.log('=== Login Response ===');
        console.log('Full connexion_agent:', JSON.stringify(connexion_agent, null, 2));
        
        if (connexion_agent.code === '200' && connexion_agent.la_boulangerie) {
          const agent = connexion_agent.agent_connecte[0];
          const bakery = connexion_agent.la_boulangerie[0];
          
          console.log('=== Login Details ===');
          console.log('Bakery:', JSON.stringify(bakery, null, 2));
          console.log('Agent:', JSON.stringify(agent, null, 2));
      
          if (agent) {
            const userData: User = {
              id_agent: agent.id_agent,
              id_site: agent.id_site,
              bakeryId: agent.id_boul,
              bakeryName: bakery.nom_commercial,
              sites: bakery.les_sites?.map(site => ({
                id_site: site.id_site.toString(),
                id_boul: agent.id_boul.toString(),
                code_site: site.code_site,
                adresse: site.adresse,
                actif: site.actif,
                nom_site: site.nom_site,
                tel: site.tel,
                nom_gerant: bakery.nom_gerant
              } as Site)) || null,
              nom_agent: agent.nom_agent,
              tel_agent: agent.tel_agent,
              login_agent: agent.login_agent,
              libelle_profil: agent.libelle_profil,
              id_type_agent: agent.id_type_agent,
              agent_actif: agent.agent_actif,
              code_site: agent.code_site,
              adresse: agent.adresse,
              site_actif: agent.site_actif,
              nom_site: agent.nom_site,
              tel_site: agent.tel_site,
              nom_gerant: agent.nom_gerant
            };

            console.log('=== User Data Being Set ===');
            console.log('userData:', JSON.stringify(userData, null, 2));
            
            // First update localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('localStorage updated:', localStorage.getItem('user'));
            
            // Then update context
            setUser(userData);
            console.log('Context updated with user data');
            
            console.log('=== Calling loadParams ===');
            console.log('id_boul:', agent.id_boul, 'id_site:', agent.id_site);
            await loadParams(agent.id_boul, agent.id_site);
            console.log('=== Params Loaded Successfully ===');
            
            // Rediriger vers la page appropriée en fonction du profil
            const profileRoutes: { [key: string]: string } = {
              'Manager': '/manager',
              'Gérant': '/gerant',
              'Comptable': '/comptable',
              'Caissier': '/caissier',
            };
            
            const route = profileRoutes[agent.libelle_profil] || '/dashboard';
            setPendingRedirect(route);
            router.push(route);
          } else {
            setError('Aucun agent correspondant ou actif trouvé.');
            setLoading(false);
          }
        } else {
          setError(connexion_agent.entete || 'Erreur inconnue.');
          setLoading(false);
        }
      } else {
        setError('Erreur: Aucune réponse du serveur.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erreur API:', err);
      setError(err instanceof ApiError ? err.message : 'Erreur de connexion au serveur.');
      setLoading(false);
    }
  };

  const user = useContext(UserContext).user;
 
  return { 
    handleLogin, 
    loading, 
    error, 
    user, 
    params,
    setParams
  };
}
