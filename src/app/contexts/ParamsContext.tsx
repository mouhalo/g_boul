// src/app/contexts/ParamsContext.tsx
'use client';
import React, { createContext, useState } from 'react';
import { envoyerRequeteApi } from '../apis/api';

export interface Article {
  id_article: number;
  nom_article: string;
  nom_type: string;
  id_type: number;
  pu_livreur: number;
  pu_boutique: number;
  pu_revente: number;
  nb_jour: number;
  id_site: number;
}

export interface TypeVariable {
  id_type: number;
  libelle: string;
  nom_variable: string;
}

export interface Site {
  id_site: number;
  id_boul: number;
  code_site: string;
  adresse: string;
  actif: boolean;
  nom_site: string;
  tel: string;
  nom_gerant: string;
}

export interface Produit {
  id_produit: number;
  nom_produit: string;
  id_unite: number;
  nom_unite: string;
}

export interface Client {
  id_client: number;
  id_site: number;
  nom_client: string;
  nom_type: string;
  id_type: number;
  tel_client: string;
  adresse: string;
  actif: boolean;
}

export interface Agent {
  id_agent: number;
  nom_agent: string;
  id_type_agent: number;
  id_site: number;
  id_profil: number;
  nom_site: string;
  libelle_profil: string;
  tel_agent?: string;
  login_agent?: string;
  agent_actif?: boolean;
}

export interface Fournisseur {
  id_fournisseur: number;
  nom_fournisseur: string;
  id_boul: number;
  tel_fournisseur: string;
  adresse: string;
  email: string;
  actif: boolean;
}

export interface Vente {
  id_vente: number;
  id_site: number;
  id_boul: number;
  nom_site: string;
  date_op: string;
  id_article: number;
  nom_article: string;
  nom_type: string;
  id_type: number;
  qte: number;
  pu: number;
  total: number;
  mt_encaisse: number;
  reliquat: number;
  id_detail: number;
  id_agent: number;
  nom_agent: string;
  montant: number;
  id_client: number;
  nom_acteur: string;
}

export interface AppParams {
  typesCuisson?: TypeVariable[];
  typesUnite?: TypeVariable[];
  typesRecette?: TypeVariable[];
  typesProfil?: TypeVariable[];
  typesDepense?: TypeVariable[];
  typesVente?: TypeVariable[];
  typesClient?: TypeVariable[];
  produits?: Produit[];
  articles?: Article[];
  clients?: Client[];
  sites?: Site[];
  unites?: TypeVariable[];
  fournisseurs?: Fournisseur[];
  agents?: Agent[];
  ventes?: Vente[];
}


interface ParamsContextProps {
  params: AppParams | null;
  setParams: (params: AppParams | null) => void;
  loadParams: (id_boul: number, id_site?: number) => Promise<void>;
}

export const ParamsContext = createContext<ParamsContextProps>({
  params: null,
  setParams: () => {},
  loadParams: async () => {},
});



export function ParamsProvider({ children }: { children: React.ReactNode }) {
  const [params, setParams] = useState<AppParams | null>(null);

  const loadParams = async (id_boul: number, id_site: number = 0) => {
    console.log('🚀 loadParams - DÉBUT');
    try {
      console.log('📥 Paramètres reçus:', { id_boul, id_site });
      
      if (id_boul <= 0) {
        console.error('❌ Erreur: id_boul doit être positif');
        return;
      }

      console.log('✅ Validation OK');
      const query = `SELECT * FROM public.get_all_params(${id_boul}, ${id_site})`;
      console.log('🔍 Requête SQL:', query);
      
      console.log('🌐 Envoi requête API...');
      const response = await envoyerRequeteApi('boulangerie', query);
      console.log('📦 Réponse API brute:', response);
      
      if (!Array.isArray(response)) {
        console.error('❌ Erreur: La réponse n\'est pas un tableau');
        return;
      }

      if (response.length === 0) {
        console.error('❌ Erreur: La réponse est vide');
        return;
      }

      if (!response[0]?.get_all_params) {
        console.error('❌ Erreur: Structure de réponse invalide');
        console.log('📦 Structure reçue:', JSON.stringify(response[0], null, 2));
        return;
      }

      const data = response[0].get_all_params;
      console.log('📊 Données brutes:', data);
      console.log('📊 Les unités brutes:', data.unites);
      console.log('📊 Les agents bruts:', data.les_agents);
      console.log('📊 Type de data.les_agents:', data.les_agents ? typeof data.les_agents : 'undefined');
      console.log('📊 Est-ce que data.les_agents est un tableau?', Array.isArray(data.les_agents));
      console.log('📊 Longueur de data.les_agents:', data.les_agents?.length || 0);
      console.log('📊 Données par type:');
      console.log('- Articles:', data.les_articles?.length ?? 0);
      console.log('- Produits:', data.les_produits?.length ?? 0);
      console.log('- Clients:', data.les_clients?.length ?? 0);
      console.log('- Agents:', data.les_agents?.length ?? 0);
      console.log('- Unités:', data.unites?.length ?? 0);
      console.log('- Sites:', data.les_sites?.length ?? 0);
      console.log('- Types:', {
        cuisson: data.les_types_cuisson?.length ?? 0,
        unite: data.unites?.length ?? 0,
        recette: data.les_types_recette?.length ?? 0,
        profil: data.les_types_profil?.length ?? 0,
        depense: data.les_types_depense?.length ?? 0,
        vente: data.les_types_vente?.length ?? 0,
        client: data.les_types_client?.length ?? 0,
        fournisseur: data.les_fournisseurs?.length ?? 0
      });

   
      const paramsData = response[0].get_all_params;
      console.log('📦 Paramètres extraits:', paramsData);
      
      const paramsToSet = {
        articles: paramsData.les_articles || [],
        clients: paramsData.les_clients || [],
        fournisseurs: paramsData.les_fournisseurs || [],
        unites: paramsData.unites || [],
        sites: paramsData.les_sites || [],
        typesCuisson: paramsData.les_types_cuisson || [],
        typesUnite: paramsData.unites || [],
        typesRecette: paramsData.les_types_recette || [],
        typesProfil: paramsData.les_types_profil || [],
        typesDepense: paramsData.les_types_depense || [],
        typesVente: paramsData.les_types_vente || [],
        produits: paramsData.les_produits || [],
        typesClient: paramsData.les_types_client || [],
        agents: paramsData.les_agents || [],
        ventes: paramsData.list_ventes || []
      };
      
      console.log('💾 Mise à jour du contexte...');
      setParams(paramsToSet);
      console.log('✨ Contexte mis à jour avec succès');
    } catch (err) {
      console.error('💥 Erreur dans loadParams:', err);
      throw err;
    }
    console.log('🏁 loadParams - FIN');
  };

  return (
    <ParamsContext.Provider value={{ params, setParams, loadParams }}>
      {children}
    </ParamsContext.Provider>
  );
}
