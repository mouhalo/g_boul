'use client';

import { useEffect, useState, useCallback, useContext } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { envoyerRequeteApi } from '@/app/apis/api';
import { useServerPagination } from '@/hooks/useServerPagination';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext, TypeVariable, Site, Article, Agent } from '@/app/contexts/ParamsContext';
import { Skeleton } from '@/components/ui/skeleton';
import AddVenteModal from '@/app/manager/ventes/AddVenteModal';
import VisuelVenteModal from '@/app/manager/ventes/VisuelVenteModal';
import { Plus, Calendar, Store, ShoppingBag, CreditCard, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CustomPagination } from '@/app/components/CustomPagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types
interface VenteDetail {
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
}

interface Vente {
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

interface DeleteVenteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  venteId: number;
  venteDate: string;
}

// Composant pour la confirmation de suppression
//Vérifier la suppression de la vente

const DeleteVenteDialog: React.FC<DeleteVenteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  venteId,
  venteDate,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: "#A52A2A" }}>Confirmer la suppression</DialogTitle>
          <DialogDescription style={{ color: "#000" }}>
            Êtes-vous sûr de vouloir supprimer la vente #{venteId} du {venteDate} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function GestionVentesPage() {
  const { toast } = useToast();
  const params = useParams();
  const bakeryId = params?.bakeryId ? parseInt(params.bakeryId as string) : null;
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);

  // États
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);

  // États pour les filtres
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dateFin, setDateFin] = useState<Date>(new Date());

  // États pour les options de filtres dynamiques
  const [availableTypes, setAvailableTypes] = useState<TypeVariable[]>([]);
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);

  // Nouveaux états pour les totaux globaux
  const [globalTotals, setGlobalTotals] = useState({ montant: 0, encaisse: 0 });

  const pagination = useServerPagination(10); // 10 ventes par page

  const paginationInfo = {
    startIndex: pagination.offset,
    endIndex: Math.min((pagination.currentPage * pagination.limit) - 1, pagination.totalItems - 1)
  };

  // Chargement des ventes (avec filtres et pagination)
  const loadVentes = useCallback(async () => {
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
      if (selectedType !== '') {
        filters.push(`v.id_type = ${selectedType}`);
      }
      if (selectedArticle !== '') {
        filters.push(`v.id_vente IN (SELECT DISTINCT id_vente FROM list_ventes WHERE id_article = ${selectedArticle})`);
      }
      if (selectedAgent !== '') {
        filters.push(`v.id_agent = ${selectedAgent}`);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      console.log("Filtres appliqués:", filters);
      console.log("Clause WHERE:", whereClause);

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
      }[]>('boulangerie', query);

      const countResponse = await envoyerRequeteApi<[{ total: number }]>('boulangerie', countQuery);
      const total = countResponse && countResponse.length > 0 ? countResponse[0].total : 0;

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
            nom_acteur: item.nom_acteur
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
      setGlobalTotals({ montant: totalMontantGlobal, encaisse: totalEncaisseGlobal });

      // Pagination sur les résultats
      const paginatedVentes = ventesGrouped.slice(0, pagination.limit);
      pagination.setItems(paginatedVentes);
      pagination.setTotalItems(total);

      if (detailsResponse && detailsResponse.length > 0) {
        loadFilterOptions(detailsResponse);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des ventes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes. Veuillez réessayer.",
        variant: "destructive",
      });
      pagination.setItems([]);
      pagination.setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSite, selectedType, selectedArticle, selectedAgent, dateDebut, dateFin, pagination, toast]);

  const loadFilterOptions = (data: {
    id_type: number;
    nom_type: string;
    id_article: number;
    nom_article: string;
    id_agent: number;
    nom_agent: string;
  }[]) => {
    if (!data || !data.length) return;
    const typesSet = new Set<number>();
    const typesArray: TypeVariable[] = [];
    const articlesSet = new Set<number>();
    const articlesArray: Article[] = [];
    const agentsSet = new Set<number>();
    const agentsArray: Agent[] = [];
    data.forEach(item => {
      if (!typesSet.has(item.id_type)) {
        typesSet.add(item.id_type);
        typesArray.push({
          id_type: item.id_type,
          libelle: item.nom_type || 'vide',
          nom_variable: `type_${item.id_type}`
        });
      }
      if (!articlesSet.has(item.id_article)) {
        articlesSet.add(item.id_article);
        articlesArray.push({
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
      if (!agentsSet.has(item.id_agent)) {
        agentsSet.add(item.id_agent);
        agentsArray.push({
          id_agent: item.id_agent,
          nom_agent: item.nom_agent,
          id_type_agent: 0,
          id_site: 0,
          id_profil: 0,
          libelle_profil: ''
        });
      }
    });
    // Tri des tableauxpar ordre alphabétique
    typesArray.sort((a, b) => {
      // Vérification que a.libelle et b.libelle ne sont pas null ou undefined
      const libelleA = a.libelle || '';
      const libelleB = b.libelle || '';
      return libelleA.localeCompare(libelleB);
    });
    
    articlesArray.sort((a, b) => {
      const nomA = a.nom_article || '';
      const nomB = b.nom_article || '';
      return nomA.localeCompare(nomB);
    });
    
    agentsArray.sort((a, b) => {
      const nomA = a.nom_agent || '';
      const nomB = b.nom_agent || '';
      return nomA.localeCompare(nomB);
    });
    setAvailableTypes(typesArray);
    setAvailableArticles(articlesArray);
    setAvailableAgents(agentsArray);
  };

  // Chargement initial au montage de la page
  useEffect(() => {
    if (bakeryId) {
      const now = new Date();
      setDateDebut(new Date(now.getFullYear(), now.getMonth(), 1));
      setDateFin(new Date());
      const timer = setTimeout(() => {
        loadVentes();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bakeryId, loadVentes, user]);

  // Fonction déclenchée par le bouton "Appliquer"
  const applyFilters = () => {
    pagination.goToFirstPage();
    loadVentes();
  };

  const resetFilters = () => {
    setSelectedSite('');
    setSelectedType('');
    setSelectedArticle('');
    setSelectedAgent('');
    const now = new Date();
    setDateDebut(new Date(now.getFullYear(), now.getMonth(), 1));
    setDateFin(new Date());
    pagination.goToFirstPage();
    loadVentes();
  };

  const goToFirstPage = () => pagination.goToFirstPage();
  const goToPreviousPage = () => pagination.goToPreviousPage();
  const goToNextPage = () => pagination.goToNextPage();
  const goToLastPage = () => pagination.goToLastPage();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  // 3. Fonction handleViewDetails pour voir les détails d'une vente
  const handleViewDetails = (vente: Vente) => {
    setSelectedVente(vente);
    setShowDetailsModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#A52A2A" }}>Gestion des Ventes</h1>
        <Button 
          onClick={() => {
            setSelectedVente(null);
            setShowAddModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Vente
        </Button>
      </div>

      {/* Zone de filtres */}
      <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date début</label>
            <input
              type="date"
              value={dateDebut ? format(dateDebut, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateDebut(new Date(e.target.value))}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date fin</label>
            <input
              type="date"
              value={dateFin ? format(dateFin, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDateFin(new Date(e.target.value))}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Site</label>
            <select
              value={selectedSite}
              onChange={(e) => {
                console.log("Site sélectionné:", e.target.value);
                setSelectedSite(e.target.value);
              }}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les sites</option>
              {siteParams?.sites?.map((site: Site) => (
                <option key={site.id_site} value={site.id_site.toString()}>
                  {site.nom_site}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Type de vente</label>
            <select
              value={selectedType}
              onChange={(e) => {
                console.log("Type sélectionné:", e.target.value);
                setSelectedType(e.target.value);
              }}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les types</option>
              {availableTypes.map((type) => (
                <option key={type.id_type} value={type.id_type.toString()}>
                  {type.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Article</label>
            <select
              value={selectedArticle}
              onChange={(e) => {
                console.log("Article sélectionné:", e.target.value);
                setSelectedArticle(e.target.value);
              }}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les articles</option>
              {availableArticles.map((article) => (
                <option key={article.id_article} value={article.id_article.toString()}>
                  {article.nom_article}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => {
                console.log("Agent sélectionné:", e.target.value);
                setSelectedAgent(e.target.value);
              }}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les agents</option>
              {availableAgents.map((agent) => (
                <option key={agent.id_agent} value={agent.id_agent.toString()}>
                  {agent.nom_agent}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="border-red-500 text-red-600 hover:bg-red-50"
          >
            Réinitialiser
          </Button>
          <Button 
            variant="outline" 
            onClick={applyFilters}
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            Appliquer
          </Button>
        </div>
      </div>

      {/* Affichage des Totaux globaux */}
      <div className="bg-white p-4 rounded-lg mb-6 shadow border border-gray-300">
        <p className="text-gray-800 font-medium">
          Total Montant des Ventes : {globalTotals.montant.toLocaleString()} FCFA
        </p>
        <p className="text-gray-800 font-medium">
          Total Montant Encaisse : {globalTotals.encaisse.toLocaleString()} FCFA
        </p>
      </div>

      {/* Affichage des ventes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : pagination.items.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium" style={{ color: "#000" }}>Aucune vente trouvée</h3>
          <p className="text-gray-500">Modifiez vos critères de recherche ou créez une nouvelle vente.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(pagination.items as Vente[]).map((vente) => (
              <Card key={vente.id_vente} className="shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-2" style={{ backgroundColor: "#ffe5e5" }}>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center" style={{ color: "#A52A2A" }}>
                      Vente #{vente.id_vente}
                    </CardTitle>
                    <Badge 
                      className="bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(vente)}
                    >
                      {vente.details.length} article(s)
                    </Badge>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(vente.date_op)}
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 mr-2" style={{ color: "#A52A2A" }} />
                        <span style={{ color: "#000" }}>Site:</span>
                      </div>
                      <span className="font-medium" style={{ color: "#000" }}>{vente.nom_site}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-2" style={{ color: "#A52A2A" }} />
                        <span style={{ color: "#000" }}>Quantité totale:</span>
                      </div>
                      <span className="font-medium" style={{ color: "#000" }}>{vente.total_quantite}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" style={{ color: "#A52A2A" }} />
                        <span style={{ color: "#000" }}>Montant total:</span>
                      </div>
                      <span className="font-medium" style={{ color: "#000" }}>
                        {vente.total_montant.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" style={{ color: "#000" }} />
                        <span style={{ color: "#000" }}>Montant encaissé:</span>
                      </div>
                      <span className="font-medium" style={{ color: "#000" }}>
                        {vente.total_encaisse.toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" style={{ color: "#A52A2A" }} />
                        <span style={{ color: "#000" }}>Agent:</span>
                      </div>
                      <span className="font-medium" style={{ color: "#000" }}>{vente.nom_agent}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleViewDetails(vente)}
                  >
                    Voir détails
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {pagination.totalItems > 0 && (
            <div className="mt-6 border-t pt-6 flex flex-col items-center" style={{ borderColor: "#A52A2A" }}>
              <p className="text-sm text-gray-600 mb-3">
                Affichage de {paginationInfo.startIndex + 1} à {Math.min(paginationInfo.endIndex + 1, pagination.totalItems)} sur {pagination.totalItems} ventes
              </p>
              <CustomPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={paginationInfo.startIndex}
                endIndex={paginationInfo.endIndex}
                onFirstPage={goToFirstPage}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
                onLastPage={goToLastPage}
              />
            </div>
          )}
        </>
      )}

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

      {/* Modal de confirmation de suppression */}
      {showDeleteDialog && selectedVente && (
        <DeleteVenteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={() => {}}
          venteId={selectedVente.id_vente}
          venteDate={format(new Date(selectedVente.date_op), 'dd/MM/yyyy')}
        />
      )}
    </div>
  );
}
