'use client';

import React, { useEffect, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { UserContext } from '@/app/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Calendar, 
  Edit, 
  Trash2, 
  PackageOpen, 
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
import EditDetailModal from '@/app/caissier/ventes/components/EditDetailModal';

// Types
import { 
  ArticleVendu, 
  FilterOptions, 
  DetailActions 
} from '@/app/caissier/ventes/types';

interface ArticlesVendusTabProps {
  isLoading: boolean;
  filterOptions: FilterOptions;
  articlesVendus: ArticleVendu[];
  articlesStats: {
    totalArticles: number;
    totalQuantite: number;
    totalMontant: number;
  };
  detailActions: DetailActions;
}

const ArticlesVendusTab: React.FC<ArticlesVendusTabProps> = ({
  isLoading,
  filterOptions,
  articlesVendus,
  articlesStats,
  detailActions
}) => {
  // États locaux pour les filtres
  const [articlesList, setArticlesList] = useState<{ id: string; label: string }[]>([]);
  const [clientsList, setClientsList] = useState<{ id: string; label: string }[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const { user } = useContext(UserContext);
  // État pour le modal d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ArticleVendu | null>(null);

  // useEffect pour charger directement les articles et clients
  useEffect(() => {
    const loadFilterData = async () => {
      setLoadingFilters(true);

      try {
        // Requête pour les articles
        const articlesQuery = `
          SELECT DISTINCT a.id_article, a.nom_article
          FROM list_ventes a
          WHERE a.id_type != 44 and a.id_site = ${user?.id_site}
          ORDER BY a.nom_article
        `;
        
        // Requête pour les clients
        const clientsQuery = `
          SELECT DISTINCT c.id_client, c.nom_acteur as nom_client, c.id_site
          FROM list_ventes c
          WHERE c.id_type != 44 and c.id_site = ${user?.id_site}
          ORDER BY c.nom_acteur
        `;
        
        // Exécuter les requêtes en parallèle
        const [articlesData, clientsData] = await Promise.all([
          envoyerRequeteApi('boulangerie', articlesQuery),
          envoyerRequeteApi('boulangerie', clientsQuery)
        ]);

        // Transformer les données pour les listes déroulantes
        if (articlesData && Array.isArray(articlesData)) {
          const formattedArticles = articlesData.map(article => ({
            id: article.id_article.toString(),
            label: article.nom_article
          }));
          setArticlesList(formattedArticles);
          console.log("Articles chargés pour les filtres:", formattedArticles.length);
        }

        if (clientsData && Array.isArray(clientsData)) {
          const formattedClients = clientsData.map(client => ({
            id: client.id_client.toString(),
            label: client.nom_client
          }));
          setClientsList(formattedClients);
          console.log("Clients chargés pour les filtres:", formattedClients.length);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données de filtres:", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilterData();
  }, [user?.id_site]);

  // Fonction pour gérer le clic sur l'icône d'édition
  const handleEditClick = (detail: ArticleVendu) => {
    setSelectedDetail(detail);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Zone de filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-red-800">Filtres</h3>
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
          
          {/* Filtre Article - Utilise articlesList local au lieu de filterOptions.availableArticles */}
          <div className="space-y-2 text-gray-700">
            <SelectList
              label="Article"
              items={articlesList}
              value={filterOptions.selectedArticle}
              onChange={(value) => filterOptions.setSelectedArticle(value ? String(value) : '')}
              placeholder="Tous les articles"
              className="w-full"
              searchable={true}
            />
            {loadingFilters && articlesList.length === 0 && (
              <p className="text-xs text-orange-500">Chargement des articles...</p>
            )}
          </div>
          
          {/* Filtre Client - Utilise clientsList local au lieu de filterOptions.availableClients */}
          <div className="space-y-2 text-gray-700">
            <SelectList
              label="Client"
              items={clientsList}
              value={filterOptions.selectedClient}
              onChange={(value) => filterOptions.setSelectedClient(value ? String(value) : '')}
              placeholder="Tous les clients"
              className="w-full"
              searchable={true}
            />
            {loadingFilters && clientsList.length === 0 && (
              <p className="text-xs text-orange-500">Chargement des clients...</p>
            )}
          </div>
          
          {/* Boutons d'action */}
          <div className="flex items-end space-x-2">
            <Button 
              onClick={filterOptions.applyFilters}
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
              onClick={filterOptions.resetFilters}
              className="border-red-500 text-red-600 hover:bg-red-50"
              disabled={isLoading || loadingFilters}
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
            <CardTitle className="text-base font-medium text-gray-700">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{articlesStats.totalArticles}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Total Quantité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{articlesStats.totalQuantite}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700">Montant Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{articlesStats.totalMontant.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tableau des articles vendus avec défilement vertical */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <ListFilter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-700">Liste des articles vendus</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Chargement des articles...</span>
          </div>
        ) : articlesVendus.length > 0 ? (
          <div className="h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="bg-gray-100">
                  <TableHead>Date</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">PU</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articlesVendus.map((detail) => (
                  <TableRow key={detail.id_detail} className="hover:bg-gray-50">
                    <TableCell className="whitespace-nowrap text-gray-700">
                      {format(new Date(detail.date_op), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700">
                      <div className="flex items-center">
                        <PackageOpen className="h-4 w-4 text-red-600 mr-2" />
                        <span className="font-medium text-gray-700">{detail.nom_article}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-gray-700">{detail.qte}</TableCell>
                    <TableCell className="text-right text-gray-700">{detail.pu ===0 ? detail.nom_type : detail.pu.toLocaleString()} </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">{detail.total.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-gray-700">{detail.nom_client || "Client au comptant"}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(detail)}
                          className="text-blue-600 hover:bg-blue-50 border-blue-200 h-8 w-8 p-0"
                          title="Modifier"
                          
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => detailActions.handleDetailDeleteClick(detail)}
                          className="text-red-600 hover:bg-red-50 border-red-200 h-8 w-8 p-0"
                          title="Supprimer"
                          disabled={user?.libelle_profil === "Caissier"}
                        >
                          <Trash2 className="h-4 w-4" />
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
            <p className="text-gray-500">Aucun article vendu trouvé avec les critères sélectionnés.</p>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {showEditModal && (
        <EditDetailModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onDetailUpdated={detailActions.handleDeleteDetail} // Réutilisation de la fonction de mise à jour
          detail={selectedDetail}
        />
      )}
    </div>
  );
};

export default ArticlesVendusTab;