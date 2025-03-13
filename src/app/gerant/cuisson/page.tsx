"use client";

import { useEffect, useState, useCallback, useContext } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { envoyerRequeteApi } from '@/app/apis/api';
import { useApiCache } from '@/hooks/useApiCache';
import { useServerPagination } from '@/hooks/useServerPagination';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import AddCuissonModal from './AddCuissonModal';
import AddEditProduction from './AddEditProduction';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronFirst, ChevronLast,
  ChevronLeft, ChevronRight, Plus,
  AlertTriangle, Calendar, Building2,
  User, Edit, Trash2, Package
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pagination } from "@/components/ui/pagination";

interface Cuisson {
  id_cuisson: number;
  date_cuisson: string;
  id_site: number;
  nom_site: string;
  nom_agent: string;
  tot_produit: number;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cuissonId: number;
  cuissonDate: string;
}

// Composant modal de confirmation de suppression
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, cuissonId, cuissonDate }: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
        <div className="flex items-center text-amber-600 mb-4">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">Confirmation de suppression</h2>
        </div>
        
        <p className="mb-6 text-gray-700">
          Êtes-vous sûr de vouloir supprimer la cuisson <span className="font-bold">#{cuissonId}</span> du <span className="font-bold">{format(new Date(cuissonDate), 'dd MMMM yyyy', { locale: fr })}</span> ? 
          Cette action est irréversible.
        </p>
        
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function CuissonPage() {
  const { toast } = useToast();
  const params = useParams();
  const bakeryId = params?.bakeryId ? parseInt(params.bakeryId as string) : null;
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCuisson, setSelectedCuisson] = useState<Cuisson | null>(null);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // Premier jour du mois en cours
  });
  const [dateFin, setDateFin] = useState<Date | undefined>(new Date());

  const pagination = useServerPagination<Cuisson>(10);
  const { fetchData: fetchCuissons } = useApiCache<{ cuissons: Cuisson[], total: number }>('cuissons');

  const loadCuissons = useCallback(async () => {
    if (!bakeryId) return;

    setIsLoading(true);
    try {
      const query = `
        WITH PaginatedCuissons AS (
          SELECT 
            id_cuisson, 
            id_site, 
            nom_site, 
            date_cuisson, 
            heure_cuisson,
            COUNT(*) OVER() as total_count
          FROM list_cuissons 
          WHERE id_boul = ${bakeryId}
          GROUP BY id_cuisson, id_site, nom_site, date_cuisson, heure_cuisson
          ORDER BY date_cuisson DESC, heure_cuisson DESC
          LIMIT ${pagination.limit} 
          OFFSET ${pagination.offset}
        )
        SELECT 
          id_cuisson, 
          id_site, 
          nom_site, 
          date_cuisson, 
          heure_cuisson,
          total_count
        FROM PaginatedCuissons
      `;
      
      const response = await fetchCuissons(query);
      if (response) {
        pagination.setItems(response.cuissons);
        pagination.setTotalItems(response.total);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des cuissons:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les cuissons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [bakeryId, pagination, fetchCuissons, toast]);

  useEffect(() => {
    if (bakeryId) {
      loadCuissons();
    }
  }, [bakeryId, loadCuissons]);

  const handleDelete = async (cuisson: Cuisson) => {
    setSelectedCuisson(cuisson);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!bakeryId || !selectedCuisson) return;

    try {
      const query = `
        DELETE FROM cuissons 
        WHERE id_cuisson = ${selectedCuisson.id_cuisson} 
        AND id_boul = ${bakeryId}
        RETURNING 'OK' as delete_cuisson
      `;

      const response = await envoyerRequeteApi('boulangerie', query);
      if (response) {
        toast({
          title: "Succès",
          description: "Cuisson supprimée avec succès",
        });
        setShowDeleteDialog(false);
        setSelectedCuisson(null);
        loadCuissons();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la cuisson",
        variant: "destructive",
      });
    }
  };

  const handleEditProductions = (cuisson: Cuisson) => {
    setSelectedCuisson(cuisson);
    setShowProductionModal(true);
  };

  // Fonctions de pagination
  const goToFirstPage = () => pagination.goToFirstPage();
  const goToPreviousPage = () => pagination.goToPreviousPage();
  const goToNextPage = () => pagination.goToNextPage();
  const goToLastPage = () => pagination.goToLastPage();

  // Formatage des dates pour l'affichage
  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'dd MMM yyyy', { locale: fr });
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
  };

  return (
    <div className="container mx-auto p-6 relative min-h-screen pb-20">
      <Tabs defaultValue="cuisson">
        <TabsList className="bg-gray-100 p-1 mb-6">
          <TabsTrigger value="cuisson" className="data-[state=active]:bg-white data-[state=active]:text-gray-800">Cuisson</TabsTrigger>
          <TabsTrigger value="rendement" className="data-[state=active]:bg-white data-[state=active]:text-gray-800">Rendement</TabsTrigger>
        </TabsList>

        <TabsContent value="cuisson">
          <div className="space-y-6">
            {/* Filtres améliorés */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date début</label>
                  <div className="relative border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="block w-full pl-10 pr-3 py-2 border-0">
                      <div className="w-full">
                        <DatePicker
                          placeholder="Date début"
                          value={dateDebut}
                          onChange={(date) => setDateDebut(date || new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                        />
                      </div>
                      {dateDebut && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-sm text-gray-500">{formatDateForDisplay(dateDebut)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date fin</label>
                  <div className="relative border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="block w-full pl-10 pr-3 py-2 border-0">
                      <div className="w-full">
                        <DatePicker
                          placeholder="Date fin"
                          value={dateFin}
                          onChange={(date) => setDateFin(date || new Date())}
                        />
                      </div>
                      {dateFin && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-sm text-gray-500">{formatDateForDisplay(dateFin)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Site</label>
                  <div className="relative border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <Select 
                      value={selectedSite} 
                      onValueChange={handleSiteChange}
                      disabled={user?.libelle_profil  !== 'Manager'}
                    >
                      <SelectTrigger className="pl-10 border-0 focus:ring-0 focus:shadow-none">
                        <SelectValue placeholder="Sélectionner un site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les sites</SelectItem>
                        {siteParams?.sites?.map((site) => (
                          <SelectItem key={site.id_site} value={site.id_site.toString()}>
                            {site.nom_site}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  onClick={loadCuissons} 
                  className="bg-gray-900 text-white hover:bg-gray-800 w-full md:w-auto"
                >
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Progress Bar de chargement */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(pagination.pageSize)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pagination.items.map((cuisson) => (
                    <div key={cuisson.id_cuisson} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500 font-semibold">
                            #{cuisson.id_cuisson}
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <p className="font-medium">
                              {format(new Date(cuisson.date_cuisson), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-500" />
                            <p className="text-sm">{cuisson.nom_site}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-amber-500" />
                            <p className="text-sm">{cuisson.tot_produit} produits</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-500" />
                            <p className="text-sm text-gray-600">{cuisson.nom_agent || '---'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditProductions(cuisson)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cuisson)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.goToPage}
                  className="mt-4"
                />
              </>
            )}
            
            {/* Barre de navigation du bas */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-4">
                <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={pagination.currentPage === 1}>
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={pagination.currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pagination.currentPage === pagination.totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToLastPage} disabled={pagination.currentPage === pagination.totalPages}>
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rendement">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tableau des rendements par produit</h2>
            {/* TODO: Implémenter le tableau des rendements */}
            <div className="py-10 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
              Contenu à venir
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bouton Nouvelle cuisson flottant */}
      <Button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        <span>Nouvelle cuisson</span>
      </Button>

      {/* Modal AddEditCuisson */}
      <AddCuissonModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadCuissons}
        siteID={user?.id_site || 0}
      />

      {/* Modal AddEditProduction */}
      {selectedCuisson && showProductionModal && (
        <AddEditProduction
          open={showProductionModal}
          onClose={() => {
            setShowProductionModal(false);
            setSelectedCuisson(null);
          }}
          onSuccess={loadCuissons}
          cuissonId={selectedCuisson.id_cuisson}
          bakeryId={user?.bakeryId || 0}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDeleteModal
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          cuissonId={selectedCuisson?.id_cuisson || 0}
          cuissonDate={selectedCuisson?.date_cuisson || ''}
        />
      )}
    </div>
  );
}