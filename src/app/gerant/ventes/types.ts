// Types pour la page des ventes
import { TypeVariable, Article, Agent, AppParams } from '@/app/contexts/ParamsContext';

export interface VenteDetail {
  id_detail: number;
  id_vente: number;
  id_article: number;
  nom_article: string;
  qte: number;
  pu: number;
  total: number;
  nom_type: string;
  id_type: number;
  nom_acteur: string;
  mt_encaisse: number;
}

export interface Vente {
  id_vente: number;
  id_site: number;
  id_boul: number;
  nom_site: string;
  date_op: string;
  id_agent: number;
  nom_agent: string;
  id_client: number;
  nom_acteur: string;
  total_quantite: number;
  total_montant: number;
  total_encaisse: number;
  details: VenteDetail[];
}

export interface ArticleVendu {
  id_detail: number;
  id_vente: number;
  date_op: string;
  nom_article: string;
  id_article: number;
  qte: number;
  pu: number;
  total: number;
  nom_client: string;
  id_client: number;
  nom_type: string;
  id_type: number;
  libelle_type: string;
}

export interface FilterOptions {
  dateDebut: Date;
  dateFin: Date;
  setDateDebut: (date: Date) => void;
  setDateFin: (date: Date) => void;
  
  selectedSite: string;
  setSelectedSite: (siteId: string) => void;
  
  selectedTypeVente: string;
  setSelectedTypeVente: (typeId: string) => void;
  
  selectedAgent: string;
  setSelectedAgent: (agentId: string) => void;
  
  selectedArticle: string;
  setSelectedArticle: (articleId: string) => void;
  
  selectedClient: string;
  setSelectedClient: (clientId: string) => void;
  
  availableTypes: TypeVariable[];
  availableArticles: Article[];
  availableAgents: Agent[];
  availableClients: {id_client: number, nom_client: string}[];
  
  siteParams: AppParams | null; // Type des paramètres de l'application
  
  applyFilters: () => void;
  resetFilters: () => void;
}

export interface DetailActions {
  handleDeleteDetail: () => void;
  handleDetailDeleteClick: (detail: ArticleVendu) => void;
  handleDetailEditClick: (detail: ArticleVendu) => void;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    goToFirstPage: () => void;
    goToPreviousPage: () => void;
    goToNextPage: () => void;
    goToLastPage: () => void;
    offset: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    items: Vente[];  // Spécifiez explicitement le type Vente[]
    setItems: (items: Vente[]) => void;  // Spécifiez le type
    setTotalItems: (total: number) => void;
    paginationInfo: {
      startIndex: number;
      endIndex: number;
    };
  }