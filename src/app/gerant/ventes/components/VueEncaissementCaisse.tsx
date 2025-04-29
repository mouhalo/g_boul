'use client';

import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { UserContext } from '@/app/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Calendar, 
  Edit, 
  DollarSign, 
  ListFilter, 
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SelectList } from '@/components/ui/select-list';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { envoyerRequeteApi } from '@/app/apis/api';
import DetailsEncaissementModal from './DetailsEncaissementModal';

// Types
import { FilterOptions } from '@/app/caissier/ventes/types';

interface Encaissement {
  date_encaisse: string;
  id_client: number;
  nom_client: string;
  id_site: number;
  nom_site: string;
  total_achats: number;
  total_paiements: number;
  montant_encaisse: number;
  solde_journalier: number;
}

interface EncaissementStats {
  totalClients: number;
  totalAchats: number;
  totalPaiements: number;
  soldeTotal: number;
}

interface VueEncaissementCaisseProps {
  isLoading: boolean;
  filterOptions: FilterOptions;
}

const VueEncaissementCaisse: React.FC<VueEncaissementCaisseProps> = ({
  isLoading: isLoadingProp,
  filterOptions
}) => {
  // États locaux
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(isLoadingProp);
  const [clientsList, setClientsList] = useState<{ id: string; label: string }[]>([]);
  const [sitesList, setSitesList] = useState<{ id: string; label: string }[]>([]);
  const [loadingFilters, setLoadingFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stats, setStats] = useState<EncaissementStats>({
    totalClients: 0,
    totalAchats: 0,
    totalPaiements: 0,
    soldeTotal: 0
  });
  
  // État pour le modal de détails
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedEncaissement, setSelectedEncaissement] = useState<Encaissement | null>(null);
  
  const { user } = useContext(UserContext);

  // Chargement des clients et sites pour les filtres
  useEffect(() => {
    const loadFiltersData = async () => {
      setLoadingFilters(true);
      try {
        // Requête pour les clients
        const clientsQuery = `
          SELECT DISTINCT id_client, nom_client
          FROM client 
          WHERE id_client IN (
            SELECT DISTINCT id_acteur FROM journal_compte WHERE type_acteur = 'C'
          )
          ORDER BY nom_client
        `;
        
        const clientsData = await envoyerRequeteApi('boulangerie', clientsQuery);

        if (clientsData && Array.isArray(clientsData)) {
          const formattedClients = clientsData.map(client => ({
            id: client.id_client.toString(),
            label: client.nom_client
          }));
          setClientsList(formattedClients);
          console.log("Clients chargés pour les filtres:", formattedClients.length);
        }

        // Requête pour les sites (uniquement pour les managers)
        if (user?.libelle_profil === 'Manager' || user?.libelle_profil === 'Gérant') {
          const sitesQuery = `
            SELECT id_site, nom_site
            FROM site
            ORDER BY nom_site
          `;
          
          const sitesData = await envoyerRequeteApi('boulangerie', sitesQuery);
          
          if (sitesData && Array.isArray(sitesData)) {
            const formattedSites = sitesData.map(site => ({
              id: site.id_site.toString(),
              label: site.nom_site
            }));
            setSitesList(formattedSites);
            console.log("Sites chargés pour les filtres:", formattedSites.length);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données de filtres:", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFiltersData();
  }, [user]);
  
  // Chargement des encaissements
  const loadEncaissements = useCallback(async () => {
    setIsLoading(true);
    try {
      // Construction des filtres
      const filters: string[] = [];
      
      if (filterOptions.dateDebut && filterOptions.dateFin) {
        filters.push(`date_encaisse BETWEEN '${format(filterOptions.dateDebut, 'yyyy-MM-dd')}' AND '${format(filterOptions.dateFin, 'yyyy-MM-dd')}'`);
      }
      
      // Filtrage par site selon le profil utilisateur
      if (user?.libelle_profil === 'Manager' || user?.libelle_profil === 'Gérant') {
        // Pour le manager, on filtre par le site sélectionné s'il y en a un
        if (filterOptions.selectedSite) {
          filters.push(`id_site = ${filterOptions.selectedSite}`);
        }
      } else {
        // Pour les autres profils (caissier, etc.), on limite aux encaissements de leur site
        filters.push(`id_site = ${user?.id_site || 0}`);
      }
      
      if (filterOptions.selectedClient) {
        filters.push(`id_client = ${filterOptions.selectedClient}`);
      }
      
      // Filtrage par recherche sur nom_client
      if (searchTerm.trim()) {
        filters.push(`nom_client ILIKE '%${searchTerm.trim()}%'`);
      }
      
      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      
      const query = `
        SELECT 
          date_encaisse,
          id_client,
          nom_client,
          id_site,
          nom_site,
          total_achats,
          total_paiements,
          montant_encaisse,
          solde_journalier
        FROM list_encaissements
        ${whereClause}
        ORDER BY date_encaisse DESC, nom_client
      `;
      
      console.log("Requête encaissements:", query);
      
      const response = await envoyerRequeteApi<Encaissement[]>('boulangerie', query);
      
      if (response && Array.isArray(response)) {
        setEncaissements(response);
        
        // Calculer les statistiques
        const uniqueClients = new Set(response.map(e => e.id_client)).size;
        const totalAchats = response.reduce((sum, e) => sum + e.total_achats, 0);
        const totalPaiements = response.reduce((sum, e) => sum + e.total_paiements, 0);
        const soldeTotal = response.reduce((sum, e) => sum + e.solde_journalier, 0);
        
        setStats({
          totalClients: uniqueClients,
          totalAchats,
          totalPaiements,
          soldeTotal
        });
        
        console.log("Encaissements chargés:", response.length);
      } else {
        console.error("Format de données incorrect:", response);
        setEncaissements([]);
        setStats({
          totalClients: 0,
          totalAchats: 0,
          totalPaiements: 0,
          soldeTotal: 0
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des encaissements:", error);
      setEncaissements([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterOptions.dateDebut, filterOptions.dateFin, filterOptions.selectedClient, filterOptions.selectedSite, user?.id_site, user?.libelle_profil, searchTerm]);

  // Charger les encaissements au départ et quand les filtres changent
  useEffect(() => {
    loadEncaissements();
  }, [loadEncaissements]);

  // Fonction pour appliquer les filtres manuellement (recherche et bouton Appliquer)
  const handleApplyFilters = () => {
    loadEncaissements();
  };

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = () => {
    setSearchTerm("");
    filterOptions.setSelectedClient("");
    filterOptions.setSelectedSite("");
    
    // Réinitialiser les dates au mois en cours
    const now = new Date();
    filterOptions.setDateDebut(new Date(now.getFullYear(), now.getMonth(), 1));
    filterOptions.setDateFin(new Date());
    
    // Recharger après réinitialisation
    loadEncaissements();
  };

  // Fonction pour ouvrir le modal de détails
  const handleViewDetails = (encaissement: Encaissement) => {
    setSelectedEncaissement(encaissement);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Zone de filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Filtres des encaissements</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre date début */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date début:</label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={format(filterOptions.dateDebut, 'yyyy-MM-dd')}
                onChange={(e) => filterOptions.setDateDebut(new Date(e.target.value))}
                className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Filtre date fin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date fin:</label>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input
                type="date"
                value={format(filterOptions.dateFin, 'yyyy-MM-dd')}
                onChange={(e) => filterOptions.setDateFin(new Date(e.target.value))}
                className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Site */}
          {(user?.libelle_profil === 'Manager' || user?.libelle_profil === 'Gérant') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Site:</label>
              <SelectList
                items={sitesList}
                value={filterOptions.selectedSite || ''}
                onChange={(value) => filterOptions.setSelectedSite(value ? String(value) : '')}
                placeholder="Tous les sites"
                disabled={loadingFilters}
                className="w-full"
              />
            </div>
          )}
          
          {/* Filtre Client */}
          <div className="space-y-2 text-gray-700">
            <SelectList
              label="Client"
              items={clientsList}
              value={filterOptions.selectedClient}
              onChange={(value) => filterOptions.setSelectedClient(value ? String(value) : '')}
              placeholder="Tous les clients"
              className="w-full"
              searchable={true}
              disabled={loadingFilters}
            />
            {loadingFilters && clientsList.length === 0 && (
              <p className="text-xs text-orange-500">Chargement des clients...</p>
            )}
          </div>
          
          {/* Recherche de client */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recherche client:</label>
            <div className="flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom du client..."
                className="border text-gray-700 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500 w-full"
              />
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex items-end space-x-2">
            <Button 
              onClick={handleApplyFilters}
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
              disabled={isLoading || loadingFilters}
            >
              {isLoading || loadingFilters ? (
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
              onClick={handleResetFilters}
              className="border-red-500 text-red-600 hover:bg-red-50"
              disabled={isLoading || loadingFilters}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Clients uniques</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{stats.totalClients}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Total Achats</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.totalAchats.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Total Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.totalPaiements.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Solde Global</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.soldeTotal >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {stats.soldeTotal.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tableau des encaissements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <ListFilter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-700">Liste des encaissements</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Chargement des encaissements...</span>
          </div>
        ) : encaissements.length > 0 ? (
          <div className="h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="bg-gray-100">
                  <TableHead>Site</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total Achats</TableHead>
                  <TableHead className="text-right">Total Paiements</TableHead>
                  <TableHead className="text-right">Montant Encaissé</TableHead>
                  <TableHead className="text-right">Solde Journalier</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encaissements.map((encaissement, index) => (
                  <TableRow key={`${encaissement.id_client}-${encaissement.date_encaisse}-${index}`} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap text-gray-700">
                      {encaissement.nom_site}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700">
                      {format(new Date(encaissement.date_encaisse), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                        <span className="font-medium text-gray-700">{encaissement.nom_client}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-gray-700">{encaissement.total_achats.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right text-gray-700">{encaissement.total_paiements.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right text-gray-700">{encaissement.montant_encaisse.toLocaleString()} FCFA</TableCell>
                    <TableCell className={`text-right font-medium ${encaissement.solde_journalier >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {encaissement.solde_journalier.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(encaissement)}
                          className="text-blue-600 hover:bg-blue-50 border-blue-200 h-8 w-8 p-0"
                          title="Détails et encaissement"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Aucun encaissement trouvé avec les critères sélectionnés.</p>
          </div>
        )}
      </div>
      
      {/* Modal de détails et encaissement */}
      {showDetailsModal && selectedEncaissement && (
        <DetailsEncaissementModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEncaissement(null);
          }}
          onSave={() => {
            loadEncaissements();
            setShowDetailsModal(false);
            setSelectedEncaissement(null);
          }}
          clientId={selectedEncaissement.id_client}
          clientName={selectedEncaissement.nom_client}
          siteId={selectedEncaissement.id_site}
          dateDebut={filterOptions.dateDebut}
          dateFin={filterOptions.dateFin}
          totalAchats={selectedEncaissement.total_achats}
        />
      )}
    </div>
  );
};

export default VueEncaissementCaisse;