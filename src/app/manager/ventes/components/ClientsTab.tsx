'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
// Locale fr importée pour être utilisée dans le formatage des dates
import { Loader2, Search, FileText, Calendar, RefreshCw } from 'lucide-react';
import SelectList from '@/components/ui/select-list';
import { FilterOptions } from '../types';
import { envoyerRequeteApi } from '@/app/apis/api';
import ClientHistoryModal from './ClientHistoryModal';
import ClientEncaissementModal from './ClientEncaissementModal';

// Types pour les données des clients
interface ClientData {
  id_client: number;
  nom_client: string;
  total_achats: number;
  total_paiements: number;
  solde: number;
  statut_compte: string;
  derniere_activite: string;
  jours_depuis_derniere_activite: number;
  moyenne_achats_mensuel: number;
  ratio_paiement: number;
  categorie_client: string;
}

interface GlobalStats {
  nb_transactions: number;
  total_achats: number;
  total_paiements: number;
  solde_total: number;
}

interface ClientsTabProps {
  isLoading?: boolean; // Rendu optionnel car non utilisé
  filterOptions: FilterOptions;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ filterOptions }) => {
  const { toast } = useToast();
  
  // États pour les données
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    nb_transactions: 0,
    total_achats: 0,
    total_paiements: 0,
    solde_total: 0
  });
  const [loading, setLoading] = useState(true);
  
  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les modaux
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEncaissementModal, setShowEncaissementModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isRegularizing, setIsRegularizing] = useState(false);
  
  // Chargement des données des clients
  const loadClientsData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: string[] = [];
      
      // Filtrer sur les transactions dans la période plutôt que sur derniere_activite
      if (filterOptions.dateDebut && filterOptions.dateFin) {
        filters.push(`id_client IN (
          SELECT DISTINCT id_client FROM vue_historique_transactions_client 
          WHERE date_mouv BETWEEN '${format(filterOptions.dateDebut, 'yyyy-MM-dd')}' AND '${format(filterOptions.dateFin, 'yyyy-MM-dd')}'
        )`);
      }
      
      if (filterOptions.selectedSite && filterOptions.selectedSite !== '0') {
        filters.push(`id_client IN (
          SELECT DISTINCT id_client FROM vue_historique_transactions_client 
          WHERE id_site = ${filterOptions.selectedSite}
        )`);
      }
      
      if (filterOptions.selectedClient && filterOptions.selectedClient !== '') {
        filters.push(`id_client = ${filterOptions.selectedClient}`);
      }
      
      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      
      const query = `
        SELECT * FROM vue_situation_compte_clients
        ${whereClause}
        ORDER BY solde DESC
      `;
      
      const response = await envoyerRequeteApi<ClientData[]>('boulangerie', query);
      
      if (response && Array.isArray(response)) {
        setClients(response);
        setFilteredClients(response);
        
        // Calculer les statistiques globales
        const stats: GlobalStats = {
          nb_transactions: response.length,
          total_achats: response.reduce((sum, client) => sum + client.total_achats, 0),
          total_paiements: response.reduce((sum, client) => sum + client.total_paiements, 0),
          solde_total: response.reduce((sum, client) => sum + client.solde, 0)
        };
        
        setGlobalStats(stats);
      } else {
        setClients([]);
        setFilteredClients([]);
        setGlobalStats({
          nb_transactions: 0,
          total_achats: 0,
          total_paiements: 0,
          solde_total: 0
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filterOptions, toast]);
  
  // Effet pour charger les données initiales
  useEffect(() => {
    loadClientsData();
  }, [loadClientsData]);
  
  // Effet pour filtrer les clients en fonction du terme de recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.nom_client.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);
  
  // Fonction pour régulariser le compte d'un client
  const handleRegularizeClient = async (client: ClientData) => {
    setIsRegularizing(true);
    try {
      const dateMin = format(filterOptions.dateDebut || new Date(), 'yyyy-MM-dd');
      const dateMax = format(filterOptions.dateFin || new Date(), 'yyyy-MM-dd');
      
      const query = `SELECT regulariser_comptes_clients_v2(p_id_client:=${client.id_client}, p_date_min := '${dateMin}', p_date_max := '${dateMax}')`;
      
      const response = await envoyerRequeteApi<{regulariser_comptes_clients_v2: string}[]>('boulangerie', query);
      
      if (response) {
        toast({
          title: "Succès",
          description: `Le compte de ${client.nom_client} a été régularisé avec succès`,
        });
        
        // Recharger les données pour refléter les changements
        loadClientsData();
      }
    } catch (error) {
      console.error("Erreur lors de la régularisation du compte client:", error);
      toast({
        title: "Erreur",
        description: "Impossible de régulariser le compte du client",
        variant: "destructive",
      });
    } finally {
      setIsRegularizing(false);
    }
  };
  
  // Fonctions pour ouvrir les modaux
  const handleViewHistory = (client: ClientData) => {
    setSelectedClient(client);
    setShowHistoryModal(true);
  };
  
  const handleViewEncaissements = (client: ClientData) => {
    setSelectedClient(client);
    setShowEncaissementModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Zone de filtres */}
      <div className="p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-medium mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Date de début */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={format(filterOptions.dateDebut || new Date(), 'yyyy-MM-dd')}
              onChange={(e) => filterOptions.setDateDebut(new Date(e.target.value))}
              className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          {/* Date de fin */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={format(filterOptions.dateFin || new Date(), 'yyyy-MM-dd')}
              onChange={(e) => filterOptions.setDateFin(new Date(e.target.value))}
              className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          {/* Liste des sites */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Site</label>
            <SelectList
              items={filterOptions.siteParams?.sites?.map((site) => ({
                id: site.id_site,
                label: site.nom_site
              })) || []}
              value={filterOptions.selectedSite}
              onChange={(value) => filterOptions.setSelectedSite(value as string)}
              placeholder="Tous les sites"
            />
          </div>
          
          {/* Liste des clients */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Client</label>
            <SelectList
              items={filterOptions.availableClients?.map((client) => ({
                id: client.id_client,
                label: client.nom_client
              })) || []}
              value={filterOptions.selectedClient}
              onChange={(value) => filterOptions.setSelectedClient(value as string)}
              placeholder="Tous les clients"
              searchable={true}
            />
          </div>
          
          {/* Champ de recherche */}
          <div className="relative col-span-1 md:col-span-4">
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-blue-700"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={filterOptions.resetFilters}
            className="border-red-500 text-red-600 hover:bg-red-50"
          >
            Réinitialiser
          </Button>
          <Button
            onClick={filterOptions.applyFilters}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Appliquer
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Nombre de transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {globalStats.nb_transactions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total achats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {globalStats.total_achats.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {globalStats.total_paiements.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Solde total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {globalStats.solde_total.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Liste des clients */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
          <span className="ml-2 text-lg text-gray-600">Chargement des données clients...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <Card key={client.id_client} className="overflow-hidden">
                <CardHeader className={`
                  pb-2 
                  ${client.statut_compte === 'Débiteur' ? 'bg-red-50' : ''}
                  ${client.statut_compte === 'Créditeur' ? 'bg-green-50' : ''}
                  ${client.statut_compte === 'Équilibré' ? 'bg-gray-50' : ''}
                `}>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{client.nom_client}</CardTitle>
                    <div className={`text-xs font-medium rounded-full px-2 py-1 
                      ${client.statut_compte === 'Débiteur' ? 'bg-red-100 text-red-800' : ''}
                      ${client.statut_compte === 'Créditeur' ? 'bg-green-100 text-green-800' : ''}
                      ${client.statut_compte === 'Équilibré' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {client.statut_compte}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-gray-500">Catégorie:</div>
                    <div>{client.categorie_client}</div>
                    
                    <div className="font-medium text-gray-500">Total achats:</div>
                    <div>{client.total_achats.toLocaleString()} FCFA</div>
                    
                    <div className="font-medium text-gray-500">Total paiements:</div>
                    <div>{client.total_paiements.toLocaleString()} FCFA</div>
                    
                    <div className="font-medium text-gray-500">Solde:</div>
                    <div className={`font-bold ${client.solde > 0 ? 'text-red-600' : client.solde < 0 ? 'text-green-600' : ''}`}>
                      {client.solde.toLocaleString()} FCFA
                    </div>
                    
                    <div className="font-medium text-gray-500">Ratio paiement:</div>
                    <div>{client.ratio_paiement}%</div>
                    
                    <div className="font-medium text-gray-500">Dernière activité:</div>
                    <div>{client.derniere_activite ? format(new Date(client.derniere_activite), 'dd/MM/yyyy') : 'N/A'}</div>
                    
                    <div className="font-medium text-gray-500">Inactivité:</div>
                    <div>{client.jours_depuis_derniere_activite} jours</div>
                    
                    <div className="font-medium text-gray-500">Moyenne mensuelle:</div>
                    <div>{client.moyenne_achats_mensuel.toLocaleString()} FCFA</div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 py-2 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    onClick={() => handleViewHistory(client)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Historique
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                    onClick={() => handleViewEncaissements(client)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Encaissements
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => handleRegularizeClient(client)}
                    disabled={isRegularizing}
                  >
                    {isRegularizing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Régulariser
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center bg-gray-50 rounded-md">
              <p className="text-gray-500">Aucun client trouvé</p>
            </div>
          )}
        </div>
      )}
      
      {/* Modaux */}
      {selectedClient && (
        <>
          <ClientHistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            client={selectedClient}
            dateRange={{
              dateDebut: filterOptions.dateDebut || new Date(),
              dateFin: filterOptions.dateFin || new Date()
            }}
          />
          
          <ClientEncaissementModal
            isOpen={showEncaissementModal}
            onClose={() => setShowEncaissementModal(false)}
            client={selectedClient}
            dateRange={{
              dateDebut: filterOptions.dateDebut || new Date(),
              dateFin: filterOptions.dateFin || new Date()
            }}
          />
        </>
      )}
    </div>
  );
};

export default ClientsTab;