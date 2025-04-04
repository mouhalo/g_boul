'use client';

import { useState, useContext, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Edit, Trash2, AlertTriangle, Package,
  Calendar, Building2, User,
  ChevronFirst, ChevronLast,
  ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import AddCuissonModal from './AddCuissonModal';
import AddEditProduction from './AddEditProduction';

interface Cuisson {
  id_cuisson: number;
  date_cuisson: string;
  id_site: number;
  nom_site: string;
  nom_agent: string;
  tot_produit: number;
}

interface DeleteCuissonResponse {
  delete_cuisson: string;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cuissonId: number;
  uneCuisson: Cuisson;
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
  const { user } = useContext(UserContext);
  const { params } = useContext(ParamsContext);
  const { toast } = useToast();
  const sites = params?.sites || [];
  
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // Premier jour du mois en cours
  });
  const [dateFin, setDateFin] = useState<Date | undefined>(new Date());
  const [cuissons, setCuissons] = useState<Cuisson[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditProductionModalOpen, setIsEditProductionModalOpen] = useState(false);
  const [selectedCuisson, setSelectedCuisson] = useState<Cuisson | null>(null);
  const [deleteCuisson, setDeleteCuisson] = useState<Cuisson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialiser le site sélectionné en fonction du profil
  useEffect(() => {
    if (user) {
      if (user.libelle_profil !== 'Manager' && user.id_site) {
        setSelectedSite(user.id_site.toString());
      }
    }
  }, [user]);

  // Pagination
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedCuissons, setDisplayedCuissons] = useState<Cuisson[]>([]);

  useEffect(() => {
    // Calculer le nombre total de pages
    const total = Math.ceil(cuissons.length / itemsPerPage);
    setTotalPages(total || 1);
    
    // Filtrer les cuissons à afficher sur la page courante
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedCuissons(cuissons.slice(startIndex, endIndex));
  }, [cuissons, currentPage]);

  const fetchCuissons = useCallback(async () => {
    if (!user?.bakeryId) return;
    setIsLoading(true);
    try {
      const today = new Date();
      const formattedToday = format(today, 'yyyy-MM-dd');

      // Déterminer les dates à utiliser pour le filtrage
      const effectiveDateDebut = dateDebut ? format(dateDebut, 'yyyy-MM-dd') : formattedToday;
      const effectiveDateFin = dateFin ? format(dateFin, 'yyyy-MM-dd') : formattedToday;

      const query = `
        SELECT 
          lc.id_cuisson, 
          lc.date_cuisson, 
          lc.id_site, 
          lc.nom_site, 
          lc.nom_agent, 
          COUNT(id_production) AS tot_produit
        FROM 
          list_cuissons lc 
        WHERE 
          lc.id_boul = ${user.bakeryId}
          ${selectedSite && selectedSite !== 'all' ? ` AND lc.id_site = ${selectedSite}` : ''}
          AND lc.date_cuisson BETWEEN '${effectiveDateDebut}' AND '${effectiveDateFin}'
        GROUP BY 
          lc.id_cuisson, lc.date_cuisson, lc.id_site, lc.nom_site, lc.nom_agent
        ORDER BY 
          lc.id_cuisson DESC
      `;
      console.log('Envoi de la requête get cuissons...', query);
      const response = await envoyerRequeteApi<Cuisson[]>('boulangerie', query);
      console.log(' Réponse liste cuissons:', response);
      setCuissons(response || []);
      setCurrentPage(1);
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les cuissons",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.bakeryId, selectedSite, dateDebut, dateFin, toast]);

  useEffect(() => {
    if (user?.bakeryId) {
      fetchCuissons();
    }
  }, [user, fetchCuissons]);

  const handleDelete = async (cuisson: Cuisson) => {
    setDeleteCuisson(cuisson);
  };

  const confirmDelete = async () => {
    if (!user?.bakeryId || !deleteCuisson) return;

    try {
      const query = `
        DELETE FROM cuisson 
        WHERE id_cuisson = ${deleteCuisson.id_cuisson} 
        AND id_boul = ${user.bakeryId}
        RETURNING 'OK' as delete_cuisson
      `;

      const response = await envoyerRequeteApi<DeleteCuissonResponse[]>('boulangerie', query);
      if (response && response.length > 0 && response[0].delete_cuisson === 'OK') {
        toast({
          title: "Succès",
          description: "Cuisson supprimée avec succès",
        });
        fetchCuissons();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la cuisson",
          variant: "destructive",
        });
      }
    } finally {
      setDeleteCuisson(null);
    }
  };

  const handleEditProductions = (cuisson: Cuisson) => {
    setSelectedCuisson(cuisson);
    setIsEditProductionModalOpen(true);
  };

  // Fonctions de pagination
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);

  // Formatage des dates pour l'affichage
  const formatDateForDisplay = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'dd MMM yyyy', { locale: fr });
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
                      onValueChange={setSelectedSite}
                      disabled={user?.libelle_profil  !== 'Manager'}
                    >
                      <SelectTrigger className="pl-10 border-0 focus:ring-0 focus:shadow-none">
                        <SelectValue placeholder="Sélectionner un site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les sites</SelectItem>
                        {sites.map((site) => (
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
                  onClick={fetchCuissons} 
                  className="bg-gray-900 text-white hover:bg-gray-800 w-full md:w-auto"
                >
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Progress Bar de chargement */}
            {isLoading && (
              <div className="w-full bg-gray-200 rounded-full h-2 my-2">
                <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            )}

            {/* Barre de navigation de pagination */}
            <div className="bg-white rounded-lg border border-gray-200 shadow p-4 flex justify-between items-center">
              <div className="text-sm font-medium text-red-500">
                Affichage de {displayedCuissons.length} cuisson(s) sur {cuissons.length} - Page {currentPage} sur {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" size="icon" onClick={goToFirstPage} disabled={currentPage === 1}>
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages}>
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Liste des cuissons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCuissons.length > 0 ? (
                displayedCuissons.map((cuisson) => (
                  <Card key={cuisson.id_cuisson} className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
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
                            disabled={user?.libelle_profil === "Caissier"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cuisson)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={user?.libelle_profil === "Caissier"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">Aucune cuisson trouvée. Veuillez modifier vos critères de recherche.</p>
                </div>
              )}
            </div>
            
            {/* Barre de navigation du bas */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-4">
                <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={currentPage === 1}>
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages}>
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
        onClick={() => setIsAddModalOpen(true)}
        disabled={user?.libelle_profil === "Caissier"}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2"
      >
        <Plus className="h-5 w-5" />
        <span>Nouvelle cuisson</span>
      </Button>

      {/* Modal AddEditCuisson */}
      <AddCuissonModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCuissons}
        siteID={user?.id_site || 0}
      />

      {/* Modal AddEditProduction */}
      {isEditProductionModalOpen && selectedCuisson && (
        <AddEditProduction
          open={isEditProductionModalOpen}
          onClose={() => {
            setIsEditProductionModalOpen(false);
            setSelectedCuisson(null);
          }}
          onSuccess={fetchCuissons}
          cuissonId={selectedCuisson.id_cuisson}
          uneCuisson={selectedCuisson} 
          bakeryId={user?.bakeryId || 0}
          siteId={selectedCuisson.id_site}
        />
      )}

      {deleteCuisson && (
        <ConfirmDeleteModal
          isOpen={!!deleteCuisson}
          onClose={() => setDeleteCuisson(null)}
          onConfirm={confirmDelete}
          cuissonId={deleteCuisson.id_cuisson}
          cuissonDate={deleteCuisson.date_cuisson}
          uneCuisson={deleteCuisson}
        />
      )}
    </div>
  );
}