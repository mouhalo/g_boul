'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, User, Tag, Package, FileText, CreditCard } from 'lucide-react';
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
  
  // Si la modal n'est pas ouverte, ne rien afficher
  if (!open) return null;
  
  // Formatter la date pour l'affichage
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };
  
  // Obtenir les types uniques pour le filtre
  const uniqueTypes: string[] = [...new Set(vente.details.map(detail => detail.nom_type))];
  
  // Filtrer les détails si nécessaire
  const filteredDetails: VenteDetail[] = typeFilter 
    ? vente.details.filter(detail => detail.nom_type === typeFilter) 
    : vente.details;
  
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
            <Badge className="bg-amber-500">{vente.details.length} article(s)</Badge>
          </div>
        </div>
        
        {/* Informations de la vente */}
        <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Agent</p>
              <p className="font-medium text-gray-600">{vente.nom_agent}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium text-gray-600">{vente.nom_acteur || "Client au comptant"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Montant encaissé</p>
              <p className="font-medium text-gray-600">{vente.total_encaisse.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>
        
        {/* Filtre par type */}
        <div className="px-4 py-2 border-t border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-red-600">Filtrer par type:</span>
            </div>
            <select
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
              className="ml-4 p-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option className="text-sm font-medium text-gray-600" value="">Tous les types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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