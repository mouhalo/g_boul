import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Calendar, Store, CreditCard, User, Trash2, DollarSign, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomPagination } from '@/app/components/CustomPagination';
// Types
import { 
  Vente, 
  FilterOptions, 
  PaginationInfo 
} from './types';  // Utilisez un chemin relatif
import { Agent, Site } from '@/app/contexts/ParamsContext';

interface SuiviVentesTabProps {
  isLoading: boolean;
  filterOptions: FilterOptions;
  ventes: Vente[];
  globalTotals: {
    montant: number;
    encaisse: number;
    restant: number;
  };
  pagination: PaginationInfo;
  user: Agent;
  onViewDetails: (vente: Vente) => void;
  onDeleteClick: (vente: Vente) => void;
}

const SuiviVentesTab: React.FC<SuiviVentesTabProps> = ({
  isLoading,
  filterOptions,
  ventes,
  globalTotals,
  pagination,
  user,
  onViewDetails,
  onDeleteClick
}) => {
  const {
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
    availableTypes,
    availableAgents,
    siteParams,
    applyFilters,
    resetFilters
  } = filterOptions;

  // Fonction pour formatter les dates pour l'affichage
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <>
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
              onChange={(e) => setSelectedSite(e.target.value)}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les sites</option>
              {siteParams?.sites?.map((site: Site) => (
                <option key={site.id_site} value={site.id_site}>
                  {site.nom_site}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Type de vente</label>
            <select
              value={selectedTypeVente}
              onChange={(e) => setSelectedTypeVente(e.target.value)}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les types</option>
              {availableTypes.map((type) => (
                <option key={type.id_type} value={type.id_type}>
                  {type.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="block w-full p-2 text-sm text-gray-700 rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Tous les agents</option>
              {availableAgents.map((agent) => (
                <option key={agent.id_agent} value={agent.id_agent}>
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
            <RefreshCw size={16} className="mr-2" /> Réinitialiser
          </Button>
          <Button 
            variant="outline" 
            onClick={applyFilters}
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <Filter size={16} className="mr-2" /> Appliquer
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border border-red-100">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center text-lg font-medium text-gray-700">
              <ShoppingBag size={20} className="mr-2 text-red-600" />
              Total des ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {globalTotals.montant.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-green-100">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center text-lg font-medium text-gray-700">
              <CreditCard size={20} className="mr-2 text-green-600" />
              Total encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {globalTotals.encaisse.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-orange-100">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center text-lg font-medium text-gray-700">
              <DollarSign size={20} className="mr-2 text-orange-600" />
              Total restant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-700">
              {globalTotals.restant.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pagination supérieure */}
      {pagination.totalItems > 0 && (
        <div className="mb-4 flex justify-end">
          <CustomPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.paginationInfo.startIndex}
            endIndex={pagination.paginationInfo.endIndex}
            onFirstPage={pagination.goToFirstPage}
            onPreviousPage={pagination.goToPreviousPage}
            onNextPage={pagination.goToNextPage}
            onLastPage={pagination.goToLastPage}
          />
        </div>
      )}

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
      ) : ventes.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800">Aucune vente trouvée</h3>
          <p className="text-gray-500">Modifiez vos critères de recherche ou créez une nouvelle vente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ventes.map((vente) => (
            <Card key={vente.id_vente} className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2 bg-red-50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center text-red-700">
                    Vente #{vente.id_vente}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {user?.libelle_profil === "Manager" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(vente);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Supprimer la vente"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    <Badge 
                      className="bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                      onClick={() => onViewDetails(vente)}
                    >
                      {vente.details.length} article(s)
                    </Badge>
                  </div>
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
                      <Store className="h-4 w-4 mr-2 text-red-700" />
                      <span className="text-gray-700">Site:</span>
                    </div>
                    <span className="font-medium text-gray-800">{vente.nom_site}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 mr-2 text-red-700" />
                      <span className="text-gray-700">Quantité totale:</span>
                    </div>
                    <span className="font-medium text-gray-800">{vente.total_quantite}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-red-700" />
                      <span className="text-gray-700">Montant total:</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {vente.total_montant.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-green-700" />
                      <span className="text-gray-700">Montant encaissé:</span>
                    </div>
                    <span className="font-medium text-green-700">
                      {vente.total_encaisse.toLocaleString()} FCFA
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-red-700" />
                      <span className="text-gray-700">Agent:</span>
                    </div>
                    <span className="font-medium text-gray-800">{vente.nom_agent}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onViewDetails(vente)}
                >
                  Voir détails
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination inférieure */}
      {pagination.totalItems > 0 && (
        <div className="mt-6 border-t pt-6 border-red-200 flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-3">
            Affichage de {pagination.paginationInfo.startIndex + 1} à {Math.min(pagination.paginationInfo.endIndex + 1, pagination.totalItems)} sur {pagination.totalItems} ventes
          </p>
          <CustomPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.paginationInfo.startIndex}
            endIndex={pagination.paginationInfo.endIndex}
            onFirstPage={pagination.goToFirstPage}
            onPreviousPage={pagination.goToPreviousPage}
            onNextPage={pagination.goToNextPage}
            onLastPage={pagination.goToLastPage}
          />
        </div>
      )}
    </>
  );
};

export default SuiviVentesTab;
