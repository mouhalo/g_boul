'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, User, Tag, Package, FileText, CreditCard, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  mt_encaisse: number;
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
  // Champs calculés
  total_quantite: number;
  total_montant: number;
  total_encaisse: number;
  details: VenteDetail[];
}

interface VisuelVenteModalProps {
  open: boolean;
  onClose: () => void;
  vente: Vente;
}

const VisuelVenteModal: React.FC<VisuelVenteModalProps> = ({ open, onClose, vente }) => {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [articleFilter, setArticleFilter] = useState<string>('');

  // Hook useEffect placé ici pour respecter les règles des Hooks
  useEffect(() => {  
    console.log('Données ventes: ', vente);
    console.log('vente.details données :',vente.details);
  }, [vente]);
  
  // Si la modal n'est pas ouverte, ne rien afficher
  if (!open) return null;
  
  // Formatter la date pour l'affichage
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };
  
  // Obtenir les valeurs uniques pour les filtres
  const uniqueTypes: string[] = [...new Set(vente.details.map(detail => detail.nom_type))];
  const uniqueClients: string[] = [...new Set(vente.details.map(detail => detail.nom_acteur || "Client au comptant"))];
  const uniqueArticles: string[] = [...new Set(vente.details.map(detail => detail.nom_article))];
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setTypeFilter('');
    setClientFilter('');
    setArticleFilter('');
  };
  
  // Filtrer les détails avec tous les filtres combinés
  const filteredDetails: VenteDetail[] = vente.details.filter(detail => {
    // Appliquer le filtre par type si activé
    const matchesType = !typeFilter || detail.nom_type === typeFilter;
    
    // Appliquer le filtre par client si activé
    const displayActeur = detail.nom_acteur || "Client au comptant";
    const matchesClient = !clientFilter || displayActeur === clientFilter;
    
    // Appliquer le filtre par article si activé
    const matchesArticle = !articleFilter || detail.nom_article === articleFilter;
    
    // Retourner true uniquement si tous les filtres appliqués sont satisfaits
    return matchesType && matchesClient && matchesArticle;
  });
  
  // Calculer les totaux pour les détails filtrés
  const totalMontant = filteredDetails.reduce((sum, detail) => sum + detail.total, 0);
  const totalEncaisse = filteredDetails.reduce((sum, detail) => sum + (detail.mt_encaisse || 0), 0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-red-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-red-600" />
                Détails de la Vente #{vente.id_vente}
              </h2>
              <div className="flex items-center text-gray-600 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(vente.date_op)} - {vente.nom_site}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Badge className="bg-amber-500 mb-1">{vente.details.length} article(s)</Badge>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1 text-red-600" />
                <span>{vente.nom_agent}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Zone des informations et filtres */}
        <div className="px-4 py-3 border-t border-b border-gray-200 bg-gray-50">
          {/* Première ligne: Type, Montant total, Montant encaissé */}
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-3">
            {/* Filtre par type */}
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-red-600 w-16">Type:</span>
              <select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
                className="ml-2 p-1 text-sm border border-gray-300 rounded-md text-blue-600 focus:outline-none focus:ring-1 focus:ring-red-500 w-40"
              >
                <option className="text-sm font-medium text-blue-600" value="">Tous</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Montant total */}
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-600 w-32">Montant total:</span>
              <span className="text-sm font-medium text-blue-700">{totalMontant.toLocaleString()} FCFA</span>
            </div>
            
            {/* Montant encaissé */}
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm font-medium text-green-600 w-32">Montant encaissé:</span>
              <span className="text-sm font-medium text-green-700">{totalEncaisse.toLocaleString()} FCFA</span>
            </div>
          </div>
          
          {/* Deuxième ligne: Client, Article, Bouton réinitialiser */}
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            {/* Filtre par client */}
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-red-600 w-16">Client:</span>
              <select
                value={clientFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClientFilter(e.target.value)}
                className="ml-2 p-1 text-sm border border-gray-300 rounded-md text-blue-600 focus:outline-none focus:ring-1 focus:ring-red-500 w-40"
              >
                <option className="text-sm font-medium text-blue-600" value="">Tous</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtre par article */}
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-red-600 w-16">Article:</span>
              <select
                value={articleFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setArticleFilter(e.target.value)}
                className="ml-2 p-1 text-sm border border-gray-300 rounded-md text-blue-600 focus:outline-none focus:ring-1 focus:ring-red-500 w-40"
              >
                <option className="text-sm font-medium text-blue-600" value="">Tous</option>
                {uniqueArticles.map((article) => (
                  <option key={article} value={article}>
                    {article}
                  </option>
                ))}
              </select>
            </div>
          
            {/* Bouton pour réinitialiser les filtres */}
            <Button 
              onClick={resetFilters}
              size="sm"
              variant="outline" 
              className="text-xs text-gray-600 hover:bg-gray-100 flex items-center ml-auto"
            >
              <X className="h-3 w-3 mr-1" />
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
        
        {/* Tableau des détails */}
        <ScrollArea className="flex-grow">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Article</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-left">Client</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDetails.map((detail) => (
                  <TableRow key={detail.id_detail} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="text-left font-medium flex items-justify-start text-gray-600">
                        <Package className="h-4 w-4 mr-2 text-red-600" />
                        {detail.nom_article}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className="bg-blue-100 text-blue-800 border border-blue-200"
                        variant="outline"
                      >
                        {detail.nom_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-600">{detail.nom_acteur || "Client au comptant"}</TableCell>
                    <TableCell className="text-right text-gray-600">{detail.qte}</TableCell>
                    <TableCell className="text-right text-gray-600">{detail.pu.toLocaleString()} FCFA</TableCell>
                    <TableCell className="text-right font-medium text-gray-600">{detail.total.toLocaleString()} FCFA</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 border-t-2 border-gray-300 text-gray-600">
                  <TableCell colSpan={3} className="font-bold text-right">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {filteredDetails.reduce((sum, detail) => sum + detail.qte, 0)}
                  </TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right font-bold">
                    {filteredDetails.reduce((sum, detail) => sum + detail.total, 0).toLocaleString()} FCFA
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VisuelVenteModal;