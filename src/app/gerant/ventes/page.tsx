'use client';

import { useEffect, useState, useCallback, useContext,useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
//import { useParams } from 'next/navigation';
import { envoyerRequeteApi } from '@/app/apis/api';
import { useServerPagination } from '@/hooks/useServerPagination';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext, TypeVariable, Article, Agent } from '@/app/contexts/ParamsContext';
import AddVenteModal from '@/app/manager/ventes/components/AddVenteModal';
import VisuelVenteModal from '@/app/manager/ventes/VisuelVenteModal';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ShoppingBag, Package, BarChart, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter,DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Importation des composants pour chaque onglet
import SuiviVentesTab from '@/app/manager/ventes/components/SuiviVentesTab';
import ArticlesVendusTab from '@/app/manager/ventes/components/ArticlesVendusTab';
import PageConstruction from '@/app/components/PageConstruction';

// Types
import { 
  Vente, 
  ArticleVendu,
  FilterOptions
} from './types';

export default function GestionVentesPage() {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);

  // État actif des onglets
  const [activeTab, setActiveTab] = useState<string>("ventes");

  // États communs
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [dateDebut, setDateDebut] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateFin, setDateFin] = useState<Date>(new Date());


  // États pour l'onglet "Suivi ventes"
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTypeVente, setSelectedTypeVente] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [globalTotals, setGlobalTotals] = useState({ montant: 0, encaisse: 0, restant: 0 });
  const ventePagination = useServerPagination(20); // 20 ventes par page

  // États pour l'onglet "Articles vendus"
  const [selectedArticle, setSelectedArticle] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [articlesVendus, setArticlesVendus] = useState<ArticleVendu[]>([]);
  const [articlesStats, setArticlesStats] = useState({ totalArticles: 0, totalQuantite: 0, totalMontant: 0 });
  const [showDeleteDetailDialog, setShowDeleteDetailDialog] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ArticleVendu | null>(null);

  // États pour les options de filtres dynamiques
  const [availableTypes, setAvailableTypes] = useState<TypeVariable[]>([]);
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableClients, setAvailableClients] = useState<{id_client: number, nom_client: string}[]>([]);

  const ventePaginationInfo = {
    startIndex: ventePagination.offset,
    endIndex: Math.min((ventePagination.currentPage * ventePagination.limit) - 1, ventePagination.totalItems - 1)
  };





  // Chargement des ventes (avec filtres et pagination)
  const loadVentes = useCallback(async () => {
    console.log("Début de loadVentes() ");
    setIsLoading(true);
    try {
      const filters: string[] = [];
      if (dateDebut && dateFin) {
        filters.push(`v.date_op BETWEEN '${format(dateDebut, 'yyyy-MM-dd')}' AND '${format(dateFin, 'yyyy-MM-dd')}'`);
      } else if (dateDebut) {
        filters.push(`v.date_op >= '${format(dateDebut, 'yyyy-MM-dd')}'`);
      } else if (dateFin) {
        filters.push(`v.date_op <= '${format(dateFin, 'yyyy-MM-dd')}'`);
      }
      if (selectedSite !== '') {
        filters.push(`v.id_site = ${selectedSite}`);
      }
      if (selectedTypeVente !== '') {
        filters.push(`v.id_type = ${selectedTypeVente}`);
      }
      if (selectedArticle !== '') {
        filters.push(`v.id_vente IN (SELECT DISTINCT id_vente FROM list_ventes WHERE id_article = ${selectedArticle})`);
      }
      if (selectedAgent !== '') {
        filters.push(`v.id_agent = ${selectedAgent}`);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      const query = `
        SELECT 
          v.id_vente, 
          v.id_site, 
          v.id_boul, 
          v.nom_site, 
          v.date_op, 
          v.id_agent, 
          v.nom_agent, 
          v.id_client, 
          v.nom_acteur,
          v.id_detail,
          v.id_article,
          v.nom_article,
          v.id_type,
          v.nom_type,
          v.qte,
          v.pu,
          v.total,
          v.mt_encaisse,
          v.reliquat
        FROM list_ventes v
        ${whereClause}
        ORDER BY v.id_vente DESC, v.id_detail
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT id_vente) as total FROM list_ventes v
        ${whereClause}
      `;

      const detailsResponse = await envoyerRequeteApi<{
        id_vente: number;
        id_site: number;
        id_boul: number;
        nom_site: string;
        date_op: string;
        id_agent: number;
        nom_agent: string;
        id_client: number;
        nom_acteur: string;
        id_detail: number;
        id_article: number;
        nom_article: string;
        id_type: number;
        nom_type: string;
        qte: number;
        pu: number;
        total: number;
        mt_encaisse: number;
        reliquat: number;
      }[]>('boulangerie', query, '', 'array');
     
      const countResponse = await envoyerRequeteApi<{ total: number }[]>('boulangerie', countQuery, '', 'array');
      const total = countResponse.length > 0 ? countResponse[0].total : 0;

      // Regrouper les détails par vente
      const ventesMap = new Map<number, Vente>();
      if (detailsResponse && detailsResponse.length > 0) {
        detailsResponse.forEach(item => {
          if (!ventesMap.has(item.id_vente)) {
            ventesMap.set(item.id_vente, {
              id_vente: item.id_vente,
              id_site: item.id_site,
              id_boul: item.id_boul,
              nom_site: item.nom_site,
              date_op: item.date_op,
              id_agent: item.id_agent,
              nom_agent: item.nom_agent,
              id_client: item.id_client,
              nom_acteur: item.nom_acteur,
              total_quantite: 0,
              total_montant: 0,
              total_encaisse: 0,
              details: []
            });
          }
          const vente = ventesMap.get(item.id_vente)!;
          vente.details.push({
            id_detail: item.id_detail,
            id_vente: item.id_vente,
            id_article: item.id_article,
            nom_article: item.nom_article,
            qte: item.qte,
            pu: item.pu,
            total: item.total,
            nom_type: item.nom_type,
            id_type: item.id_type,
            nom_acteur: item.nom_acteur,
            mt_encaisse: item.mt_encaisse,

          });
          vente.total_quantite += item.qte;
          vente.total_montant += item.total;
          vente.total_encaisse += item.mt_encaisse || 0;
        });
      }

      const ventesGrouped = Array.from(ventesMap.values());
      // Calcul des totaux globaux sur toutes les ventes filtrées
      const totalMontantGlobal = ventesGrouped.reduce((sum, vente) => sum + vente.total_montant, 0);
      const totalEncaisseGlobal = ventesGrouped.reduce((sum, vente) => sum + vente.total_encaisse, 0);
      const totalRestantGlobal = totalMontantGlobal - totalEncaisseGlobal;
      
      setGlobalTotals({ 
        montant: totalMontantGlobal, 
        encaisse: totalEncaisseGlobal,
        restant: totalRestantGlobal
      });

      // Pagination sur les résultats
      const startIdx = (ventePagination.currentPage - 1) * ventePagination.limit;
      const paginatedVentes = ventesGrouped.slice(startIdx, startIdx + ventePagination.limit);
      
      ventePagination.setItems(paginatedVentes);
      ventePagination.setTotalItems(total);

      const filterData = detailsResponse && detailsResponse.length > 0 ? detailsResponse : [];
    
      console.log("Ventes chargées:", ventesGrouped.length);
      console.log("Ventes paginées:", paginatedVentes.length);
      return { ventesGrouped, filterData };

    } catch (error) {
      console.error("Erreur lors du chargement des ventes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes. Veuillez réessayer.",
        variant: "destructive",
      });
      ventePagination.setItems([]);
      ventePagination.setTotalItems(0);
    } finally {
      setIsLoading(false);
      console.log("Fin de loadVentes() - Désactivation de isLoading");
    }
  }, [selectedSite, selectedTypeVente, selectedArticle, selectedAgent, dateDebut, dateFin, ventePagination, toast]);

  // Chargement des articles vendus pour l'onglet "Articles vendus"
  const loadArticlesVendus = useCallback(async () => {
    if (activeTab !== 'articles') return;
    
    setIsLoadingDetails(true);
    try {
      const filters: string[] = [];
      if (dateDebut && dateFin) {
        filters.push(`v.date_op BETWEEN '${format(dateDebut, 'yyyy-MM-dd')}' AND '${format(dateFin, 'yyyy-MM-dd')}'`);
      } 
      if (selectedArticle !== '') {
        filters.push(`v.id_article = ${selectedArticle}`);
      }
      if (selectedClient !== '') {
        filters.push(`v.id_client = ${selectedClient}`);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      const query = `
        SELECT 
          v.id_detail,
          v.id_vente, 
          v.date_op,
          v.id_article,
          v.nom_article,
          v.qte,
          v.pu,
          v.total,
          v.id_client,
          v.nom_acteur as nom_client
        FROM list_ventes v
        ${whereClause}
        ORDER BY v.date_op DESC, v.nom_article
      `;

      const response = await envoyerRequeteApi<ArticleVendu[]>('boulangerie', query);
      
      if (response && Array.isArray(response)) {
        setArticlesVendus(response);
        
        // Calculer les statistiques
        const totalArticles = new Set(response.map(a => a.id_article)).size;
        const totalQuantite = response.reduce((sum, a) => sum + a.qte, 0);
        const totalMontant = response.reduce((sum, a) => sum + a.total, 0);
        
        setArticlesStats({
          totalArticles,
          totalQuantite,
          totalMontant
        });
      } else {
        setArticlesVendus([]);
        setArticlesStats({ totalArticles: 0, totalQuantite: 0, totalMontant: 0 });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des articles vendus:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles vendus.",
        variant: "destructive",
      });
      setArticlesVendus([]);
      setArticlesStats({ totalArticles: 0, totalQuantite: 0, totalMontant: 0 });
    } finally {
      setIsLoadingDetails(false);
    }
  }, [activeTab, dateDebut, dateFin, selectedArticle, selectedClient, toast]);

  // Fonction pour gérer la suppression et l'actualisation d'une vente
  const handleDeleteVente = () => {
    loadVentes();
  };

  // Fonction pour gérer la suppression et l'actualisation d'un détail de vente
  const handleDeleteDetail = () => {
    loadArticlesVendus();
  };

  // Chargement initial au montage de la page
  // Effet de chargement initial simplifié
useEffect(() => {
  console.log("Effet de chargement initial");
  
  // Initialiser les dates
  const now = new Date();
  setDateDebut(new Date(now.getFullYear(), now.getMonth(), 1));
  setDateFin(new Date());
  
  // Ne pas charger automatiquement les ventes ici
}, []); // Dépendances vides pour n'exécuter qu'au montage

// En haut du composant
const initialLoadComplete = useRef(false);
// Fonction pour traiter les données de filtre
const processFilterData = useCallback((data: Array<{
  id_type: number;
  nom_type: string;
  id_article: number;
  nom_article: string;
  id_agent: number;
  nom_agent: string;
  id_client: number;
  nom_acteur: string;
  mt_encaisse: number;
}>) => {
  if (!data || !data.length) return;
  
  // Types
  const typesMap = new Map<number, TypeVariable>();
  const articlesMap = new Map<number, Article>();
  const agentsMap = new Map<number, Agent>();
  const clientsMap = new Map<number, {id_client: number, nom_client: string}>();
  
  // Traiter les données sans dépendre des états actuels
  data.forEach(item => {
    // Types
    if (item.id_type && !typesMap.has(item.id_type)) {
      typesMap.set(item.id_type, {
        id_type: item.id_type,
        libelle: item.nom_type || 'Non défini',
        nom_variable: `type_${item.id_type}`
      });
    }
    
    // Articles
    if (item.id_article && !articlesMap.has(item.id_article)) {
      articlesMap.set(item.id_article, {
        id_article: item.id_article,
        nom_article: item.nom_article,
        nom_type: item.nom_type || '',
        id_type: item.id_type || 0,
        pu_livreur: 0,
        pu_boutique: 0,
        pu_revente: 0,
        nb_jour: 0,
        id_site: 0
      });
    }
    
    // Agents
    if (item.id_agent && !agentsMap.has(item.id_agent)) {
      agentsMap.set(item.id_agent, {
        id_agent: item.id_agent,
        nom_agent: item.nom_agent,
        id_type_agent: 0,
        id_site: 0,
        id_profil: 0,
        libelle_profil: '',
        nom_site: ''
      });
    }
    
    // Clients
    if (item.id_client && !clientsMap.has(item.id_client)) {
      clientsMap.set(item.id_client, {
        id_client: item.id_client,
        nom_client: item.nom_acteur || 'Client sans nom'
      });
    }
  });

  // Convertir les Maps en Arrays et trier
  const typesArray = Array.from(typesMap.values()).sort((a, b) => 
    (a.libelle || '').localeCompare(b.libelle || '')
  );
  
  const articlesArray = Array.from(articlesMap.values()).sort((a, b) => 
    (a.nom_article || '').localeCompare(b.nom_article || '')
  );
  
  const agentsArray = Array.from(agentsMap.values()).sort((a, b) => 
    (a.nom_agent || '').localeCompare(b.nom_agent || '')
  );
  
  const clientsArray = Array.from(clientsMap.values()).sort((a, b) => 
    (a.nom_client || '').localeCompare(b.nom_client || '')
  );

  // Mettre à jour les états
  setAvailableTypes(typesArray);
  setAvailableArticles(articlesArray);
  setAvailableAgents(agentsArray);
  setAvailableClients(clientsArray);
}, []);

// Fonction pour charger et traiter les données
const loadDataAndProcess = useCallback(async () => {
  try {
    console.log("Exécution de loadDataAndProcess");
    const result = await loadVentes();
    if (result) {
      processFilterData(result.filterData);
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
  }
}, [loadVentes, processFilterData]);

// Dans l'effet pour charger les données
useEffect(() => {
  if (!initialLoadComplete.current && activeTab === 'ventes') {
    loadDataAndProcess();
    initialLoadComplete.current = true;
  }
}, [activeTab, loadDataAndProcess]);

  // Charger les articles vendus quand on passe à l'onglet articles
  useEffect(() => {
    if (activeTab === 'articles') {
      loadArticlesVendus();
    }
  }, [activeTab, loadArticlesVendus]);

  // Fonction pour appliquer les filtres (pour les deux onglets)
  const applyFilters = () => {
    if (activeTab === 'ventes') {
      ventePagination.goToFirstPage();
      loadVentes();
    } else if (activeTab === 'articles') {
      loadArticlesVendus();
    }
  };

  // Fonction pour réinitialiser les filtres (pour les deux onglets)
  const resetFilters = () => {
    setSelectedSite('');
    setSelectedTypeVente('');
    setSelectedArticle('');
    setSelectedAgent('');
    setSelectedClient('');
    
    const now = new Date();
    setDateDebut(new Date(now.getFullYear(), now.getMonth(), 1));
    setDateFin(new Date());
    
    if (activeTab === 'ventes') {
      ventePagination.goToFirstPage();
      loadVentes();
    } else if (activeTab === 'articles') {
      loadArticlesVendus();
    }
  };

  // Préparation des options de filtre à passer aux composants enfants
  const filterOptions: FilterOptions = {
    dateDebut,
    dateFin,
    setDateDebut,
    setDateFin,
    selectedSite,
    setSelectedSite,
    selectedTypeVente, 
    setSelectedTypeVente,
    selectedAgent,
    setSelectedAgent,
    selectedArticle, 
    setSelectedArticle,
    selectedClient,
    setSelectedClient,
    availableTypes,
    availableArticles,
    availableAgents,
    availableClients,
    siteParams,
    applyFilters,
    resetFilters
  };

  // Fonctions pour les actions sur les ventes
  const handleViewDetails = (vente: Vente) => {
    setSelectedVente(vente);
    setShowDetailsModal(true);
  };

  // Préparation des fonctions de modification pour les détails d'une vente
  const detailActions = {
    handleDeleteDetail,
    handleDetailDeleteClick: (detail: ArticleVendu) => {
      setSelectedDetail(detail);
      setShowDeleteDetailDialog(true);
    },
    handleDetailEditClick: () => {
      toast({
        title: "Information",
        description: "La fonctionnalité de modification d'article sera disponible prochainement",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-700">Gestion des Ventes</h1>
        <Button 
          onClick={() => {
            setSelectedVente(null);
            setShowAddModal(true);
          }}
          className="bg-red-600 hover:bg-green-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Vente
        </Button>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ventes" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Suivi ventes
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Articles vendus
          </TabsTrigger>
          <TabsTrigger value="rendement" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" /> Rendement
          </TabsTrigger>
        </TabsList>

        {/* Contenu de l'onglet "Suivi ventes" */}
        {/* Contenu de l'onglet "Suivi ventes" */}
<TabsContent value="ventes" className="mt-4">
  {isLoading ? (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
      <span className="ml-2 text-lg text-gray-600">Chargement des ventes...</span>
    </div>
  ) : (
    <SuiviVentesTab 
      isLoading={isLoading}
      filterOptions={filterOptions}
      ventes={ventePagination.items as Vente[]}
      globalTotals={globalTotals}
      pagination={{
        ...ventePagination,
        startIndex: ventePaginationInfo.startIndex, 
        endIndex: ventePaginationInfo.endIndex,
        paginationInfo: ventePaginationInfo,
        items: ventePagination.items as Vente[]
      }}
      user={user || { libelle_profil: '', id_agent: 0 }}
      onViewDetails={handleViewDetails}
      onDeleteClick={(vente: Vente) => {
        setSelectedVente(vente);
        setShowDeleteDialog(true);
      }}
    />
  )}
</TabsContent>

        {/* Contenu de l'onglet "Articles vendus" */}
        <TabsContent value="articles" className="mt-4">
          <ArticlesVendusTab 
            isLoading={isLoadingDetails}
            filterOptions={filterOptions}
            articlesVendus={articlesVendus}
            articlesStats={articlesStats}
            detailActions={detailActions}
          />
        </TabsContent>

        {/* Contenu de l'onglet "Rendement" */}
        <TabsContent value="rendement" className="mt-4">
          <PageConstruction 
            title="Page en construction"
            message="Cette fonctionnalité sera bientôt disponible. Revenez prochainement pour visualiser les statistiques de rendement."
            icon={<BarChart className="h-24 w-24 text-gray-300" />}
            buttonText="Revenir à la page des ventes"
            buttonAction={() => setActiveTab('ventes')}
          />
        </TabsContent>
      </Tabs>

      {/* Modal d'ajout/modification */}
      {showAddModal && (
        <AddVenteModal 
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedVente(null);
          }}
          onVenteAdded={() => {
            setShowAddModal(false);
            setSelectedVente(null);
            loadVentes();
          }}
        />
      )}

      {/* Modal de visualisation des détails */}
      {showDetailsModal && selectedVente && (
        <VisuelVenteModal 
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVente(null);
          }}
          vente={selectedVente}
        />
      )}

      {/* Modals de suppression */}
      {showDeleteDialog && selectedVente && (
        <DeleteVenteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteVente}
          venteId={selectedVente.id_vente}
          venteDate={format(new Date(selectedVente.date_op), 'dd/MM/yyyy')}
        />
      )}

      {showDeleteDetailDialog && selectedDetail && (
        <DeleteDetailDialog
          isOpen={showDeleteDetailDialog}
          onClose={() => setShowDeleteDetailDialog(false)}
          onConfirm={handleDeleteDetail}
          detailId={selectedDetail.id_detail}
          articleName={selectedDetail.nom_article}
        />
      )}
    </div>
  );
}

// Composants modaux de suppression (gardés dans ce fichier pour simplicité)
interface DeleteVenteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  venteId: number;
  venteDate: string;
}

interface DeleteDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  detailId: number;
  articleName: string;
}

// Composant pour la confirmation de suppression de vente
const DeleteVenteDialog: React.FC<DeleteVenteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  venteId,
  venteDate,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const query = `delete from vente where id_vente = ${venteId} returning 'OK' as delete_vente`;
      const response = await envoyerRequeteApi<{delete_vente: string}[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].delete_vente === 'OK') {
        toast({
          title: "Succès",
          description: "Vente supprimée avec succès",
        });
        onConfirm();
      } else {
        toast({
          title: "Erreur",
          description: "Échec de la suppression de la vente",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-700">Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer la vente #{venteId} du {venteDate} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Composant pour la confirmation de suppression de détail
const DeleteDetailDialog: React.FC<DeleteDetailDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  detailId,
  articleName,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const query = `DELETE FROM detail_vente WHERE id_detail = ${detailId} RETURNING 'OK' as delete_detail`;
      const response = await envoyerRequeteApi<{delete_detail: string}[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].delete_detail === 'OK') {
        toast({
          title: "Succès",
          description: "Article supprimé avec succès",
        });
        onConfirm();
      } else {
        toast({
          title: "Erreur",
          description: "Échec de la suppression de l'article",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-700">Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l&apos;article &quot;{articleName}&quot; (#{detailId}) ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

        