'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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

// Types
import { 
  ArticleVendu, 
  FilterOptions, 
  DetailActions 
} from '@/app/manager/ventes/types';

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
          
          {/* Filtre Article */}
          <div className="space-y-2 text-gray-700">
            <SelectList
              label="Article"
              items={filterOptions.availableArticles?.map((article) => ({
                id: article.id_article.toString(),
                label: article.nom_article,
              })) || []}
              value={filterOptions.selectedArticle}
              onChange={(value) => filterOptions.setSelectedArticle(value ? String(value) : '')}
              placeholder="Tous les articles"
              className="w-full"
              searchable={true}
            />
          </div>
          
          {/* Filtre Client */}
          <div className="space-y-2 text-gray-700">
            <SelectList
              label="Client"
              items={filterOptions.availableClients?.map((client) => ({
                id: client.id_client.toString(),
                label: client.nom_client,
              })) || []}
              value={filterOptions.selectedClient}
              onChange={(value) => filterOptions.setSelectedClient(value ? String(value) : '')}
              placeholder="Tous les clients"
              className="w-full"
              searchable={true}
            />
          </div>
          
          {/* Boutons d'action */}
          <div className="flex items-end space-x-2">
            <Button 
              onClick={filterOptions.applyFilters}
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
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
      
      {/* Tableau des articles vendus */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
          <ListFilter className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium">Liste des articles vendus</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
            <span className="ml-2 text-lg text-gray-600">Chargement des articles...</span>
          </div>
        ) : articlesVendus.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                    <TableCell className="text-right text-gray-700">{detail.pu.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right font-medium text-gray-700">{detail.total.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-gray-700">{detail.nom_client || "Client au comptant"}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => detailActions.handleDetailEditClick(detail)}
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
    </div>
  );
};

export default ArticlesVendusTab;