// src/app/contexts/ParamsContext.tsx
'use client';
import React, { createContext, useState } from 'react';
import { envoyerRequeteApi } from '../apis/api';

interface Article {
  id_article: number;
  nom_article: string;
  nom_type: string;
  id_type: number;
  pu_livreur: number;
  pu_boutique: number;
  pu_revente: number;
  nb_jour: number;
}

interface TypeVariable {
  id_type: number;
  libelle: string;
  nom_variable: string;
}

interface Site {
  id_site: number;
  id_boul: number;
  code_site: string;
  adresse: string;
  actif: boolean;
  nom_site: string;
  tel: string;
  nom_gerant: string;
}

interface Client {
  id_client: number;
  id_site: number;
  nom_client: string;
  nom_type: string;
  id_type: number;
  tel_client: string;
  adresse: string;
  actif: boolean;
}

export interface AppParams {
  unites?: TypeVariable[];
  typesCuisson?: TypeVariable[];
  typesUnite?: TypeVariable[];
  typesRecette?: TypeVariable[];
  typesProfil?: TypeVariable[];
  typesDepense?: TypeVariable[];
  typesVente?: TypeVariable[];
  typesClient?: TypeVariable[];
  articles?: Article[];
  clients?: Client[];
  sites?: Site[];

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
      console.log('📊 Données par type:');
      console.log('- Articles:', data.les_articles?.length ?? 0);
      console.log('- Clients:', data.les_clients?.length ?? 0);
      console.log('- Unités:', data.les_unites?.length ?? 0);
      console.log('- Sites:', data.les_sites?.length ?? 0);
      console.log('- Types:', {
        cuisson: data.les_types_cuisson?.length ?? 0,
        unite: data.les_types_unite?.length ?? 0,
        recette: data.les_types_recette?.length ?? 0,
        profil: data.les_types_profil?.length ?? 0,
        depense: data.les_types_depense?.length ?? 0,
        vente: data.les_types_vente?.length ?? 0,
        client: data.les_types_client?.length ?? 0
      });

      const paramsToSet = {
        articles: data.les_articles || [],
        clients: data.les_clients || [],
        unites: data.les_unites || [],
        sites: data.les_sites || [],
        typesCuisson: data.les_types_cuisson || [],
        typesUnite: data.les_types_unite || [],
        typesRecette: data.les_types_recette || [],
        typesProfil: data.les_types_profil || [],
        typesDepense: data.les_types_depense || [],
        typesVente: data.les_types_vente || [],
        typesClient: data.les_types_client || []
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
