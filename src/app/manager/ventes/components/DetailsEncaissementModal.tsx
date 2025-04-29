'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { UserContext } from '@/app/contexts/UserContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, DollarSign, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { envoyerRequeteApi } from '@/app/apis/api';

interface DetailArticle {
  id_detail: number;
  id_vente: number;
  date_op: string;
  id_article: number;
  nom_article: string;
  id_type: number;
  nom_type: string;
  total: number;
  id_client: number;
  nom_client: string;
  mt_encaisse?: number;
  reste_a_payer?: number;
}

interface DetailsEncaissementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  clientId: number;
  clientName: string;
  siteId: number;
  dateDebut: Date;
  dateFin: Date;
  totalAchats: number;
}

const DetailsEncaissementModal: React.FC<DetailsEncaissementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientId,
  clientName,
  siteId,
  dateDebut,
  dateFin,
  totalAchats
}) => {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [montantEncaissement, setMontantEncaissement] = useState<number>(0);
  const [detailsArticles, setDetailsArticles] = useState<DetailArticle[]>([]);
  const [totalRestant, setTotalRestant] = useState<number>(0);

  // Charger les détails des articles achetés
  useEffect(() => {
    const loadDetailsArticles = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const query = `
          SELECT 
            v.id_detail,
            v.id_vente, 
            v.date_op,
            v.id_article,
            v.nom_article,
            v.total,
            v.id_client,
            v.nom_acteur as nom_client,
            v.id_type,
            v.nom_type,
            COALESCE(v.mt_encaisse, 0) as mt_encaisse,
            (v.total - COALESCE(v.mt_encaisse, 0)) as reste_a_payer
          FROM list_ventes v
          WHERE v.id_client = ${clientId}
          AND v.date_op BETWEEN '${format(dateDebut, 'yyyy-MM-dd')}' AND '${format(dateFin, 'yyyy-MM-dd')}'
          AND v.id_site = ${siteId}
          AND (v.total - COALESCE(v.mt_encaisse, 0)) > 0
          ORDER BY v.date_op ASC, v.id_vente ASC, v.id_detail ASC
        `;
        
        console.log("Requête détails articles:", query);
        
        const response = await envoyerRequeteApi<DetailArticle[]>('boulangerie', query);
        
        if (response && Array.isArray(response)) {
          setDetailsArticles(response);
          
          // Calculer le total restant à payer
          const totalRestantCalcule = response.reduce((sum, item) => sum + (item.reste_a_payer || 0), 0);
          setTotalRestant(totalRestantCalcule);
          
          console.log("Détails articles chargés:", response.length);
        } else {
          setDetailsArticles([]);
          setTotalRestant(0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails des articles.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDetailsArticles();
  }, [isOpen, clientId, siteId, dateDebut, dateFin, toast]);

  // Gérer le changement du montant d'encaissement
  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
      setMontantEncaissement(0);
    } else if (value > totalRestant) {
      setMontantEncaissement(totalRestant);
      toast({
        title: "Information",
        description: `Le montant maximum à encaisser est de ${totalRestant.toLocaleString()} FCFA`,
      });
    } else {
      setMontantEncaissement(value);
    }
  };

  // Enregistrer l'encaissement
  const handleSaveEncaissement = async () => {
    if (montantEncaissement <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant à encaisser doit être supérieur à 0.",
        variant: "destructive",
      });
      return;
    }
    
    if (montantEncaissement > totalRestant) {
      toast({
        title: "Erreur",
        description: `Le montant ne peut pas dépasser le total restant (${totalRestant.toLocaleString()} FCFA).`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Dispatcher le montant sur les lignes de détail
      let montantRestant = montantEncaissement;
      const resultats = [];
      
      // Parcourir les lignes par ordre chronologique
      for (const detail of detailsArticles) {
        if (montantRestant <= 0) break;
        
        // Déterminer le montant à appliquer à cette ligne
        const montantLigne = Math.min(montantRestant, detail.reste_a_payer || 0);
        montantRestant -= montantLigne;
        
        if (montantLigne <= 0) continue;
        
        // Appeler save_invendus pour cette ligne
        const query = `
          SELECT public.save_invendus(
            ${detail.id_detail},
            ${detail.id_vente},
            ${detail.id_client},
            0,
            ${montantLigne},
            ${user?.id_agent || 0}
          ) as result
        `;
        
        console.log(`Encaissement ligne ${detail.id_detail}:`, query);
        
        const response = await envoyerRequeteApi<{result: string}[]>('boulangerie', query);
        resultats.push({
          detail: detail.id_detail,
          montant: montantLigne,
          resultat: response && response.length > 0 ? response[0].result : "Erreur"
        });
      }
      
      console.log("Résultats encaissements:", resultats);
      
      // Vérifier si tous les encaissements ont réussi
      const erreurs = resultats.filter(r => r.resultat !== "OK");
      
      if (erreurs.length === 0) {
        toast({
          title: "Succès",
          description: `Encaissement de ${montantEncaissement.toLocaleString()} FCFA effectué avec succès.`,
        });
        onSave(); // Rafraîchir les données
        onClose(); // Fermer le modal
      } else {
        toast({
          title: "Attention",
          description: `${erreurs.length} encaissements n'ont pas pu être effectués.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'encaissement:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'encaissement.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-600 flex items-center">
            <DollarSign className="h-6 w-6 mr-2" />
            Encaissement pour {clientName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* En-tête avec informations et saisie du montant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-700 mb-2">Informations client</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{clientName}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Période:</span>
                    <span className="font-medium">
                      {format(dateDebut, 'dd/MM/yyyy', { locale: fr })} - {format(dateFin, 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Total achats:</span>
                    <span className="font-medium text-red-600">{totalAchats.toLocaleString()} FCFA</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-600">Reste à encaisser:</span>
                    <span className="font-medium text-blue-900">{totalRestant.toLocaleString()} FCFA</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-700 mb-3">Nouvel encaissement</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="montantEncaissement" className="block text-sm font-medium text-gray-700">
                      Montant à encaisser
                    </label>
                    <div className="relative">
                      <Input
                        id="montantEncaissement"
                        type="number"
                        value={montantEncaissement}
                        onChange={handleMontantChange}
                        className="pr-16 font-medium text-right"
                        placeholder="0"
                        disabled={isLoading}
                        max={totalRestant}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">FCFA</span>
                      </div>
                    </div>
                    {montantEncaissement > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        {montantEncaissement === totalRestant
                          ? "Encaissement complet"
                          : `Encaissement partiel (${((montantEncaissement / totalRestant) * 100).toFixed(1)}%)`}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSaveEncaissement}
                    disabled={isSaving || isLoading || montantEncaissement <= 0 || montantEncaissement > totalRestant}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Encaisser
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tableau des articles */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-700">Détails des articles à encaisser</h3>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 text-red-600 animate-spin mr-2" />
                <span>Chargement des détails...</span>
              </div>
            ) : detailsArticles.length > 0 ? (
              <div className="overflow-x-auto max-h-[40vh]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="bg-gray-100">
                      <TableHead>Date</TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Déjà encaissé</TableHead>
                      <TableHead className="text-right">Reste à payer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailsArticles.map((article) => (
                      <TableRow key={article.id_detail} className="hover:bg-gray-50">
                        <TableCell className="whitespace-nowrap text-sm text-red-500 font-medium">
                          {format(new Date(article.date_op), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-sm font-medium  text-red-500">{article.nom_article}</TableCell>
                        <TableCell className="text-sm  text-red-500 font-medium">{article.nom_type}</TableCell>
                        <TableCell className="text-right text-sm  text-red-500 font-medium">{article.total.toLocaleString()} FCFA</TableCell>
                        <TableCell className="text-right text-sm text-green-600">
                          {(article.mt_encaisse || 0).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-red-600">
                          {(article.reste_a_payer || 0).toLocaleString()} FCFA
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Ligne de total */}
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="text-right font-medium  text-red-600">Total</TableCell>
                      <TableCell className="text-right font-medium  text-red-600">
                        {detailsArticles.reduce((sum, article) => sum + article.total, 0).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {detailsArticles.reduce((sum, article) => sum + (article.mt_encaisse || 0), 0).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {detailsArticles.reduce((sum, article) => sum + (article.reste_a_payer || 0), 0).toLocaleString()} FCFA
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Aucun article à encaisser pour ce client dans la période sélectionnée.
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSaving}
            className="border-gray-200"
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetailsEncaissementModal;