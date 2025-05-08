'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Calendar, 
  Filter, 
  Trash2, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight, 
  Loader2,
  Store,
  ShoppingBag,
  User,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SelectList } from '@/components/ui/select-list';
import { Badge } from '@/components/ui/badge';
import { Agent } from '@/app/contexts/ParamsContext';

// Types
import { 
  Vente, 
  FilterOptions, 
  PaginationInfo 
} from '../types';

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
  user: {
    id_agent?: number;
    libelle_profil?: string;
    bakeryId?: number;
    bakeryName?: string;
    id_site?: number;
    nom_site?: string;
    code_site?: string;
    nom_gerant?: string;
    tel_site?: string;
    site_actif?: boolean;
    sites?: {
      id_site: number | string;
      id_boul: number | string;
      nom_site: string;
      code_site: string;
      actif: boolean;
      tel?: string;
      adresse?: string;
      nom_gerant?: string;
    }[] | null;
  } | null;
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
  return (
    <div className="space-y-6">
      {/* Zone de filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtre date début */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Date début:</label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={format(filterOptions.dateDebut, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    // Créer la date en préservant le fuseau horaire local
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day, 12, 0, 0);
                    filterOptions.setDateDebut(newDate);
                  }
                }}
                className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Filtre date fin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Date fin:</label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={format(filterOptions.dateFin, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    // Créer la date en préservant le fuseau horaire local
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day, 12, 0, 0);
                    filterOptions.setDateFin(newDate);
                  }
                }}
                className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Filtre Site */}
          <div className="space-y-2">
            <SelectList
              label="Site"
              items={filterOptions.siteParams?.sites?.map((site: {
                id_site: number | string;
                nom_site: string;
                code_site: string;
              }) => ({
                id: site.id_site.toString(),
                label: site.nom_site,
              })) || []}
              value={filterOptions.selectedSite}
              onChange={(value) => filterOptions.setSelectedSite(typeof value === 'string' ? value : '')}
              placeholder="Tous les sites"
              className="w-full text-gray-500"
            />
          </div>
          
          {/* Filtre Type Vente */}
          <div className="space-y-2">
            <SelectList
              label="Type de vente"
              items={filterOptions.availableTypes?.map((type) => ({
                id: type.id_type.toString(),
                label: type.libelle,
              })) || []}
              value={filterOptions.selectedTypeVente}
              onChange={(value) => filterOptions.setSelectedTypeVente(typeof value === 'string' ? value : '')}
              placeholder="Tous les types"
              className="w-full text-gray-500"
            />
          </div>
          
          {/* Filtre Agent */}
          <div className="space-y-2">
            <SelectList
              label="Agent"
              items={filterOptions.availableAgents?.map((agent: Agent) => ({
                id: agent.id_agent.toString(),
                label: agent.nom_agent,
              })) || []}
              value={filterOptions.selectedAgent}
              onChange={(value) => filterOptions.setSelectedAgent(typeof value === 'string' ? value : '')}
              placeholder="Tous les agents"
              className="w-full text-gray-500"
            />
          </div>
          
          {/* Boutons d'action */}
          <div className="flex items-end space-x-2">
            <Button 
              onClick={filterOptions.applyFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                "Appliquer"
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={filterOptions.resetFilters}
              className="border-red-500 text-red-600 hover:bg-red-50"
              disabled={isLoading}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Total Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{globalTotals.montant.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Total Encaissé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{globalTotals.encaisse.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Total Restant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{globalTotals.restant.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Navigation de pagination */}
      {pagination.totalItems > 0 && (
        <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-800">
            Affichage {pagination.paginationInfo.startIndex + 1} à {pagination.paginationInfo.endIndex + 1} sur {pagination.totalItems} ventes
          </div>
          <div className="space-x-1">
            <Button
              variant="outline"
              onClick={pagination.goToFirstPage}
              disabled={!pagination.hasPreviousPage || isLoading}
              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="sr-only text-gray-500">Première page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={pagination.goToPreviousPage}
              disabled={!pagination.hasPreviousPage || isLoading}
              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="sr-only text-gray-500">Page précédente</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 text-gray-500">
              Page {pagination.currentPage} sur {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={pagination.goToNextPage}
              disabled={!pagination.hasNextPage || isLoading}
              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="sr-only text-gray-500">Page suivante</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={pagination.goToLastPage}
              disabled={!pagination.hasNextPage || isLoading}
              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
            >
              <span className="sr-only text-gray-500">Dernière page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Liste des ventes en cartes */}
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
          <span className="ml-2 text-lg text-gray-600">Chargement des ventes...</span>
        </div>
      ) : ventes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ventes.map((vente) => (
            <Card key={vente.id_vente} className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2" style={{ backgroundColor: "#ffe5e5" }}>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center" style={{ color: "#A52A2A" }}>
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
                  {format(new Date(vente.date_op), 'dd MMMM yyyy', { locale: fr })}
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
                  onClick={() => onViewDetails(vente)}
                >
                  Voir détails
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">Aucune vente trouvée avec les critères sélectionnés.</p>
        </div>
      )}
    </div>
  );
};

export default SuiviVentesTab;