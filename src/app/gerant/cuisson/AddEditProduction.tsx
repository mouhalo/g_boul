'use client';

import { useState, useEffect, useContext } from 'react';
import { ShoppingBag, AlertCircle, Edit, Trash2, Plus ,AlertTriangle} from 'lucide-react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { UserContext } from '@/app/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs,  TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Recette {
  id_boul: number;
  id_site: number;
  id_recette: number;
  nom_recette: string;
  id_article: number;
  nom_article: string;
}

interface Cuisson {
  id_cuisson: number;
  id_site: number;
  date_cuisson: string;
  nom_site: string;
}

interface Production {
  id_production: number;
  id_recette: number;
  id_article: number;
  nom_article: string;
  qte: number;
}

interface AddEditProductionProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  cuissonId: number;
  uneCuisson: Cuisson;
  bakeryId: number;
  siteId?: number;
  editMode?: boolean;
  productionId?: number;
  initialQuantity?: number;
  initialRecetteId?: number;
}

interface ProductionResponse {
  id_production: number;
}

interface ConfirmDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productionId: number;
  articleName: string;
}

// Composant pour la confirmation de suppression
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, productionId, articleName }: ConfirmDeleteProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white p-4 rounded-md shadow-lg max-w-sm w-full">
        <div className="flex items-center text-amber-600 mb-4">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">Confirmation de suppression</h2>
        </div>
        <p className="mb-4 text-gray-700">
          {`Êtes-vous sûr de vouloir supprimer la production `} <span className="font-semibold">{articleName} N°{productionId}</span> ?
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};

const AddEditProduction = ({ 
  open, 
  onClose, 
  onSuccess, 
  cuissonId, 
  uneCuisson, 
  bakeryId,
  siteId,
  editMode = false,
  productionId,
  initialQuantity = 0,
  initialRecetteId
}: AddEditProductionProps) => {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [selectedRecette, setSelectedRecette] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentCuisson, setCurrentCuisson] = useState<Cuisson | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<{ id: number, name: string } | null>(null);
  const [productions, setProductions] = useState<Production[]>([]);
  const [activeTab, setActiveTab] = useState<string>('formulaire');
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [deleteProduction, setDeleteProduction] = useState<Production | null>(null);
  
  const [, setSearchTerm] = useState("");
  const filteredRecettes = recettes;

  useEffect(() => {
    if (!bakeryId || !cuissonId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Récupérer les détails de la cuisson si nécessaire
        if (!siteId) {
          const cuissonQuery = `
            SELECT id_cuisson, id_site, nom_site 
            FROM list_cuissons 
            WHERE id_cuisson = ${cuissonId} 
            AND id_boul = ${bakeryId}
            LIMIT 1
          `;
          
          const cuissonResponse = await envoyerRequeteApi<Cuisson[]>('boulangerie', cuissonQuery);
          if (cuissonResponse && cuissonResponse.length > 0) {
            setCurrentCuisson(cuissonResponse[0]);
          }
        }

        // Récupérer les productions existantes
        const productionsQuery = `
          SELECT lc.id_production, lc.id_recette, lc.id_article, lc.nom_article, lc.qte
          FROM list_cuissons lc 
          WHERE lc.id_cuisson = ${cuissonId}
          AND lc.id_boul = ${bakeryId}
          ORDER BY lc.nom_article
        `;
        
        const productionsResponse = await envoyerRequeteApi<Production[]>('boulangerie', productionsQuery);
        setProductions(productionsResponse || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [bakeryId, cuissonId, siteId, open, toast]);

  // Chargement des recettes disponibles
  useEffect(() => {
    const fetchRecettes = async () => {
      if (!bakeryId) return;
      
      const currentSiteId = siteId || (currentCuisson ? currentCuisson.id_site : null);
      if (!currentSiteId) return;

      setIsLoading(true);
      try {
        const query = `
          SELECT id_boul, id_site, id_recette, nom_recette, id_article, nom_article 
          FROM list_recettes
          WHERE id_boul = ${bakeryId} 
          AND id_site = ${currentSiteId}
          ORDER BY nom_recette
        `;
        
        const response = await envoyerRequeteApi<Recette[]>('boulangerie', query);
        setRecettes(response || []);
        
        // Si on est en mode édition et qu'une recette initiale est fournie
        if (editingProduction) {
          const recetteId = editingProduction.id_recette.toString();
          setSelectedRecette(recetteId);
          setQuantity(editingProduction.qte);
          
          const recette = response?.find(r => r.id_recette.toString() === recetteId);
          if (recette) {
            setSelectedArticle({
              id: recette.id_article,
              name: recette.nom_article
            });
          }
        } else if (editMode && initialRecetteId) {
          setSelectedRecette(initialRecetteId.toString());
          const recette = response?.find(r => r.id_recette === initialRecetteId);
          if (recette) {
            setSelectedArticle({
              id: recette.id_article,
              name: recette.nom_article
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des recettes:', error);
        if (error instanceof ApiError) {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId || currentCuisson) {
      fetchRecettes();
    }
  }, [bakeryId, siteId, currentCuisson, editMode, initialRecetteId, toast, editingProduction]);

  // Gestion du changement de recette
  const handleRecetteChange = (recetteId: string) => {
    setSelectedRecette(recetteId);
    
    // Trouver la recette correspondante pour obtenir l'article
    const recette = recettes.find(r => r.id_recette.toString() === recetteId);
    if (recette) {
      setSelectedArticle({
        id: recette.id_article,
        name: recette.nom_article
      });
    } else {
      setSelectedArticle(null);
    }
  };

  // Validation du formulaire
  const isFormValid = () => {
    return selectedRecette !== '' && quantity > 0 && selectedArticle !== null;
  };

  // Initialiser l'édition d'une production
  const handleEditProduction = (production: Production) => {
    setEditingProduction(production);
    setActiveTab('formulaire');
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setSelectedRecette('');
    setSelectedArticle(null);
    setQuantity(0);
    setEditingProduction(null);
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    resetForm();
    if (productions.length > 0) {
      setActiveTab('liste');
    }
  };

  // Supprimer une production
  const handleDeleteProduction = (production: Production) => {
    setDeleteProduction(production);
  };

  // Confirmer la suppression d'une production
  const confirmDeleteProduction = async () => {
    if (!deleteProduction || !bakeryId) return;
    
    try {
      const query = `
        DELETE FROM production 
        WHERE id_production = ${deleteProduction.id_production} 
        RETURNING 'OK' as delete_production
      `;

      const response = await envoyerRequeteApi<{delete_production: string}[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].delete_production === 'OK') {
        toast({
          title: "Succès",
          description: "Production supprimée avec succès",
        });
        
        // Mettre à jour la liste des productions
        setProductions(productions.filter(p => p.id_production !== deleteProduction.id_production));
        
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setDeleteProduction(null);
    }
  };

  // Sauvegarde de la production
  const handleSave = async () => {
    if (!isFormValid() || (!currentCuisson && !siteId)) return;
    
    setIsSaving(true);
    try {
      const currentSiteId = siteId || (currentCuisson ? currentCuisson.id_site : 0);
      const recetteId = parseInt(selectedRecette);
      const allowSave = (user?.libelle_profil === "Manager") || (user?.libelle_profil === "Gérant");
      
      if (!allowSave) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les autorisations nécessaires pour effectuer cette action.",
          variant: "destructive",
        });
        return;
      }
      
      let query = '';
      
      if (editingProduction) {
        query = `
          UPDATE production 
          SET qte = ${quantity}, id_recette = ${recetteId}, id_article = ${selectedArticle?.id}
          WHERE id_production = ${editingProduction.id_production}
          AND id_site = ${currentSiteId}
          RETURNING id_production
        `;
      } else if (editMode && productionId) {
        query = `
          UPDATE production 
          SET qte = ${quantity}
          WHERE id_production = ${productionId}
          AND id_site = ${currentSiteId}
          RETURNING id_production
        `;
      } else {
        query = `
          INSERT INTO production (id_site, id_recette, id_article, qte, id_cuisson) 
          VALUES (${currentSiteId}, ${recetteId}, ${selectedArticle?.id}, ${quantity}, ${cuissonId} )
          RETURNING id_production
        `;
      }
      
      const response = await envoyerRequeteApi<ProductionResponse[]>('boulangerie', query);
      
      if (response && response.length > 0) {
        toast({
          title: "Succès",
          description: editingProduction || (editMode && productionId)
            ? "Production mise à jour avec succès" 
            : "Production ajoutée avec succès",
        });
        
        // Mettre à jour la liste des productions ou recharger
        const productionsQuery = `
          SELECT lc.id_production, lc.id_recette, lc.id_article, lc.nom_article, lc.qte
          FROM list_cuissons lc 
          WHERE lc.id_cuisson = ${cuissonId}
          AND lc.id_boul = ${bakeryId}
          ORDER BY lc.nom_article
        `;
        
        const productionsResponse = await envoyerRequeteApi<Production[]>('boulangerie', productionsQuery);
        setProductions(productionsResponse || []);
        
        // Réinitialiser le formulaire et passer à l'onglet liste
        resetForm();
        if (productionsResponse && productionsResponse.length > 0) {
          setActiveTab('liste');
        }
        
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Affichage du bouton d'ajout
  const renderAddButton = () => {
    if (activeTab === 'liste') {
      return (
        <Button 
          onClick={() => {
            resetForm();
            setActiveTab('formulaire');
          }}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Nouvelle production
        </Button>
      );
    }
    return null;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editingProduction ? 'Modifier la production' : editMode ? 'Modifier la production' : 'Gestion des productions'}
            </h2>
            <p className="text-gray-500">Date {uneCuisson?.date_cuisson}</p>
            <p className="text-gray-500">Cuisson N°{cuissonId}</p>
          </div>
          {renderAddButton()}
        </div>
        
        {/* Progress Bar de chargement */}
        {isLoading && (
          <div className="w-full bg-gray-200 h-1">
            <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        )}
        
        {/* Tabs */}
        {productions.length > 0 && !editingProduction && !editMode && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 border-b">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="liste">Liste des productions</TabsTrigger>
                <TabsTrigger value="formulaire">Ajouter une production</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-hidden text-ellipsis text-red-500">
          <ScrollArea className="h-[calc(100%-2rem)] max-h-[400px]">
            <div className="p-4">
              {activeTab === 'liste' && productions.length > 0 && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productions.map((production) => (
                        <TableRow key={production.id_production}>
                          <TableCell className="font-medium">{production.nom_article}</TableCell>
                          <TableCell className="text-right">{production.qte}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduction(production)}
                                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduction(production)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
              )}
              {(activeTab === 'formulaire' || productions.length === 0 || editingProduction || editMode) && (
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0 space-y-4">
                    {/* Choix de la recette */}
                    <div className="space-y-2">
                      <Label htmlFor="recette" className="text-sm font-medium text-gray-700">Recette</Label>
                      <Select 
                        value={selectedRecette} 
                        onValueChange={handleRecetteChange}
                        disabled={isLoading || (!!editingProduction)}
                      >
                        <SelectTrigger id="recette" className="w-full border border-gray-300 rounded-md">
                          <SelectValue placeholder="Sélectionner une recette" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <div className="relative">
                            <input
                              className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                              placeholder="Rechercher une recette..."
                  onChange={(e) => {
                    const searchField = e.target.closest('.SelectContent')?.querySelector('input');
                    const items = e.target.closest('.SelectContent')?.querySelectorAll('.SelectItem');
                    const searchTerm = e.target.value.toLowerCase();
                    
                    items?.forEach((item) => {
                      const text = item.textContent?.toLowerCase() || '';
                      if (text.includes(searchTerm)) {
                        item.classList.remove('hidden');
                      } else {
                        item.classList.add('hidden');
                      }
                    });
                  }}
                />
                          </div>
                          <ScrollArea className="h-40 overflow-y-auto">
                            {recettes.map((recette) => (
                              <SelectItem 
                                key={recette.id_recette} 
                    value={recette.id_recette.toString()}
                    className="py-2 px-3 hover:bg-blue-50 cursor-pointer transition-colors rounded-md"
                  >
                    {recette.nom_recette}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
  
        {/* Affichage de l'article */}
        {selectedArticle && (
          <div className="bg-blue-50 p-3 rounded-md flex items-center">
            <ShoppingBag className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Article produit</p>
              <p className="font-medium text-gray-800 truncate">{selectedArticle.name}</p>
            </div>
          </div>
        )}
  
        {/* Champ de quantité */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantité produite</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="border border-gray-300 rounded-md w-full"
          />
          {quantity === 0 && (
            <div className="flex items-center text-amber-500 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>Veuillez saisir une quantité supérieure à zéro</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="secondary" onClick={editingProduction ? handleCancelEdit : onClose} disabled={isSaving}>
            {editingProduction ? `Annuler l&apos;édition` : "Fermer"}
          </Button>
          {(activeTab === 'formulaire' || productions.length === 0 || editingProduction || editMode) && (
            <Button 
              onClick={handleSave} 
              disabled={!isFormValid() || isSaving}
              className={!isFormValid() ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
            >
              {isSaving ? "Sauvegarde en cours..." : "Sauvegarder"}
            </Button>
          )}
        </div>
      </div>
      
      {/* Modal de confirmation de suppression */}
      {deleteProduction && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteProduction)}
          onClose={() => setDeleteProduction(null)}
          onConfirm={confirmDeleteProduction}
          productionId={deleteProduction.id_production}
          articleName={deleteProduction.nom_article}
        />
      )}
    </div>
  );
};

export default AddEditProduction;