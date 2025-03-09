// Types pour les paramètres
export type ParameterType = keyof Parameters;

export type ComplexType = 'sites' | 'articles' | 'clients';

export type MenuSection = ParameterType | ComplexType | 'boulangerie';

export interface Parameter {
  id_type: string;
  libelle: string;
  nom_variable?: string;
}

export interface Parameters {
  unites: Parameter[];
  typesVente: Parameter[];
  typesClient: Parameter[];
}

// Types pour les éléments complexes
export interface Site {
  id_site: string;
  id_boul: string;
  code_site: string;
  adresse: string;
  actif: boolean;
  nom_site: string;
  tel: string;
  nom_gerant: string;
}

export interface Article {
  id_article: string;
  id_boul: string;
  id_site: string;
  nom_article: string;
  nom_type: string;
  id_type: string;
  prix_livreur: number;
  prix_boutique: number;
  prix_rvte: number;
  nb_jour: number;
}

export interface Client {
  id_client: string;
  id_site: string;
  nom_client: string;
  nom_type: string;
  id_type: string;
  tel_client: string;
  adresse: string;
  actif: boolean;
}

export interface Boulangerie {
  id_boul: string;
  nom_commercial: string;
  sigle: string;
  nom_gerant: string;
  adresse: string;
  tel_gerant: string;
  actif: boolean;
  email: string;
  control_stock: boolean;
  annee_encours: string;
  les_sites: Site[];
  articles: Article[];
  clients: Client[];
  parameters: Parameters;
}

export interface SystemUser {
  id: string;
  username: string;
  boulangerie: Boulangerie;
}

export interface ParameterValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export interface ParameterTypeConfig {
  label: string;
  tooltip: string;
  validation: Record<keyof Parameter, ParameterValidation>;
}

export const PARAMETER_CONFIGS: Record<ParameterType, ParameterTypeConfig> = {
  unites: {
    label: "Unités",
    tooltip: "Gérer les unités de mesure utilisées dans les recettes",
    validation: {
      id_type: { required: true },
      libelle: { required: true, minLength: 2, maxLength: 50 },
      nom_variable: { required: true, pattern: /^[A-Z_]+$/ }
    }
  },
  typesVente: {
    label: "Types de Vente",
    tooltip: "Définir les différents types de vente",
    validation: {
      id_type: { required: true },
      libelle: { required: true, minLength: 2, maxLength: 50 },
      nom_variable: { required: true, pattern: /^[A-Z_]+$/ }
    }
  },
  typesClient: {
    label: "Types de Client",
    tooltip: "Catégoriser les différents types de clients",
    validation: {
      id_type: { required: true },
      libelle: { required: true, minLength: 2, maxLength: 50 },
      nom_variable: { required: true, pattern: /^[A-Z_]+$/ }
    }
  }
};
