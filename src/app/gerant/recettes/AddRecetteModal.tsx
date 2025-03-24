'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { UserContext } from '@/app/contexts/UserContext';
import { ShoppingBag, AlertCircle, Edit, Trash2, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
interface Article {
  id_article: number;
  nom_article: string;
}

interface Site {
  id_site: number;
  nom_site: string;
}

interface Produit {
  id_produit: number;
  nom_produit: string;
}

export interface Unite {
  id_unite: number;
  nom_unite: string;
}

interface RecetteResponse {
  id_boul: number;
  id_site: number;
  id_recette: number;
  nom_recette: string;
  id_article: number;
  nom_article: string;
  nom_type: string;
  qte_prod: number;
  temps_cuisson: number;
  actif: boolean;
  nom_site: string;
}

interface SaveRecetteResponse {
  save_recette: string;
}

interface IngredientResponse {
  id_boul: number;
  id_ingredient: number;
  id_recette: number;
  id_produit: number;
  nom_produit: string;
  qte: number;
  id_unite: number;
  nom_unite: string;
}

interface SaveIngredientResponse {
  save_ingredient: string;
}

interface ConfirmDeleteProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'warning' | 'danger' | 'info';
}

interface RecetteFormProps {
  articles: Article[];
  sites: Site[];
  recetteToEdit?: RecetteResponse;
  onSave: (recetteData: RecetteFormData) => Promise<void>;
  isSaving: boolean;
}

interface RecetteFormData {
  nomRecette: string;
  selectedArticle: string;
  qteProduction: string;
  tempsCuisson: string;
  selectedSite: string;
}

interface IngredientsListProps {
  ingredients: IngredientResponse[];
  onAddIngredient: () => void;
  onEditIngredient: (ingredient: IngredientResponse) => void;
  onDeleteIngredient: (ingredient: IngredientResponse) => void;
}

interface IngredientFormProps {
  produits: Produit[];
  unites: Unite[];
  ingredientToEdit?: IngredientResponse | null;
  recetteId: number;
  bakeryId: number;
  onCancel: () => void;
  isSaving: boolean;
}

interface AddRecetteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  articles: Article[];
  sites: Site[];
  produits: Produit[];
  unites: Unite[];
  bakeryId: number;
  recetteToEdit?: RecetteResponse;
}

// Énumération des onglets
enum TabType {
  RECETTE = 'recette',
  INGREDIENTS_LIST = 'ingredients-list',
  INGREDIENT_FORM = 'ingredient-form'
}

// Composant pour la confirmation des actions
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'warning',
  onConfirm,
  onCancel
}: ConfirmDeleteProps) => {
  if (!isOpen) return null;

  // Définir les couleurs selon la variante
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'info':
        return {
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
      default:
        return {
          icon: 'text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white p-4 rounded-md shadow-lg max-w-sm w-full">
        <div className={`flex items-center ${colors.icon} mb-4`}>
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="mb-4 text-gray-700">
          {message}
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'destructive' : 'default'} 
            size="sm" 
            onClick={onConfirm}
            className={variant !== 'danger' ? colors.button : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Composant de formulaire de recette
const RecetteForm = ({
  articles,
  sites,
  recetteToEdit,
  onSave,
  isSaving
}: RecetteFormProps) => {
  const isEditMode = !!recetteToEdit;
  
  // États pour la recette
  const [nomRecette, setNomRecette] = useState<string>(
    recetteToEdit?.nom_recette || ''
  );
  const [selectedArticle, setSelectedArticle] = useState<string>(
    recetteToEdit?.id_article?.toString() || ''
  );
  const [qteProduction, setQteProduction] = useState<string>(
    recetteToEdit?.qte_prod?.toString() || ''
  );
  const [tempsCuisson, setTempsCuisson] = useState<string>(
    recetteToEdit?.temps_cuisson?.toString() || '60'
  );
  const [selectedSite, setSelectedSite] = useState<string>(
    recetteToEdit?.id_site?.toString() || ''
  );

  // Validation du formulaire de recette
  const isRecetteFormValid = () => {
    return (
      nomRecette.trim() !== '' && 
      selectedArticle !== '' && 
      qteProduction !== '' && 
      parseInt(qteProduction) > 0 && 
      tempsCuisson !== '' && 
      parseInt(tempsCuisson) > 0 && 
      selectedSite !== ''
    );
  };

  // Gérer la sauvegarde
  const handleSave = async () => {
    if (!isRecetteFormValid()) return;
    
    const recetteData: RecetteFormData = {
      nomRecette,
      selectedArticle,
      qteProduction,
      tempsCuisson,
      selectedSite
    };
    
    await onSave(recetteData);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-4">
            {/* Nom de la recette */}
            <div className="space-y-2">
              <Label htmlFor="nom_recette" className="text-sm font-medium text-gray-700">Nom de la recette</Label>
              <Input
                id="nom_recette"
                value={nomRecette}
                onChange={(e) => setNomRecette(e.target.value)}
                className="border border-gray-300 rounded-md w-full"
              />
              {nomRecette.trim() === '' && (
                <div className="flex items-center text-amber-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>Le nom de la recette est requis</span>
                </div>
              )}
            </div>
            
            {/* Choix de l'article */}
            <div className="space-y-2">
              <Label htmlFor="article" className="text-sm font-medium text-gray-700">Article</Label>
              <Select 
                value={selectedArticle} 
                onValueChange={setSelectedArticle}
              >
                <SelectTrigger id="article" className="w-full border border-gray-300 rounded-md">
                  <SelectValue placeholder="Sélectionner un article" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <div className="relative">
                    <input
                      className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500 mb-2"
                      placeholder="Rechercher un article..."
                      onChange={(e) => {
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
                    {articles.map((article) => (
                      <SelectItem 
                        key={article.id_article} 
                        value={article.id_article.toString()}
                        className="py-2 px-3 hover:bg-red-50 cursor-pointer transition-colors rounded-md"
                      >
                        {article.nom_article}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            
            {/* Quantité produite */}
            <div className="space-y-2">
              <Label htmlFor="qte_produite" className="text-sm font-medium text-gray-700">Quantité produite</Label>
              <Input
                id="qte_produite"
                type="number"
                min="1"
                value={qteProduction}
                onChange={(e) => setQteProduction(e.target.value)}
                className="border border-gray-300 rounded-md w-full"
              />
              {(qteProduction === '' || parseInt(qteProduction) <= 0) && (
                <div className="flex items-center text-amber-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>La quantité doit être supérieure à zéro</span>
                </div>
              )}
            </div>
            
            {/* Temps de cuisson */}
            <div className="space-y-2">
              <Label htmlFor="temps_cuisson" className="text-sm font-medium text-gray-700">Temps de cuisson (minutes)</Label>
              <Input
                id="temps_cuisson"
                type="number"
                min="1"
                value={tempsCuisson}
                onChange={(e) => setTempsCuisson(e.target.value)}
                className="border border-gray-300 rounded-md w-full"
              />
            </div>
            
            {/* Choix du site */}
            <div className="space-y-2">
              <Label htmlFor="site" className="text-sm font-medium text-gray-700">Site</Label>
              <Select 
                value={selectedSite} 
                onValueChange={setSelectedSite}
              >
                <SelectTrigger id="site" className="w-full border border-gray-300 rounded-md">
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem 
                      key={site.id_site} 
                      value={site.id_site.toString()}
                    >
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Bouton de sauvegarde */}
            <div className="flex justify-end pt-4 sticky bottom-0 bg-white pb-2">
              <Button 
                onClick={handleSave} 
                disabled={!isRecetteFormValid() || isSaving}
                className={!isRecetteFormValid() ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}
              >
                {isSaving ? "Sauvegarde en cours..." : isEditMode ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Composant de liste des ingrédients
const IngredientsList = ({
  ingredients,
  onAddIngredient,
  onEditIngredient,
  onDeleteIngredient
}: IngredientsListProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* En-tête de la liste */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-2">
        <h3 className="text-lg font-medium text-gray-800">
          Liste des ingrédients
        </h3>
        <Button 
          onClick={onAddIngredient}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Ajouter un ingrédient
        </Button>
      </div>
      
      {/* Info du total d'ingrédients */}
      {ingredients.length > 0 && (
        <div className="mb-4 bg-red-50 p-3 rounded-md border border-red-100 sticky top-14 z-10">
          <p className="text-sm text-red-700 flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2" />
            <span>Total : {ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''}</span>
          </p>
        </div>
      )}
      
      {/* Zone défilante pour le tableau */}
      <div className="flex-1 overflow-hidden">
        {ingredients.length > 0 ? (
          <div className="overflow-auto max-h-[calc(70vh-300px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="bg-white">Produit</TableHead>
                  <TableHead className="bg-white">Quantité</TableHead>
                  <TableHead className="bg-white">Unité</TableHead>
                  <TableHead className="text-right bg-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id_ingredient} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{ingredient.nom_produit}</TableCell>
                    <TableCell className="text-right font-semibold  text-gray-900">{ingredient.qte}</TableCell>
                    <TableCell className="text-gray-600">{ingredient.nom_unite}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditIngredient(ingredient)}
                          className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteIngredient(ingredient)}
                          className="h-8 w-8 text-red-700 hover:text-red-900 hover:bg-red-50"
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
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-800">Aucun ingrédient</h3>
            <p className="text-gray-500">
              Cette recette ne contient pas encore d&apos;ingrédients.
              <br />
              <Button
                variant="link"
                onClick={onAddIngredient}
                className="text-red-500 hover:text-red-700 mt-2"
              >
                Ajouter des ingrédients
              </Button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant de formulaire d'ingrédient
const IngredientForm = ({
  produits,
  unites,
  ingredientToEdit,
  recetteId,
  bakeryId,
  onCancel,
  isSaving
}: Omit<IngredientFormProps, 'onSave'>) => {
  const { toast } = useToast();
  // États pour l'ingrédient
  const [selectedProduit, setSelectedProduit] = useState<string>('');
  const [qteIngredient, setQteIngredient] = useState<string>('');
  const [selectedUnite, setSelectedUnite] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialisation avec les valeurs de l'ingrédient à éditer, si présent
  useEffect(() => {
    if (ingredientToEdit) {
      setSelectedProduit(ingredientToEdit.id_produit.toString());
      setQteIngredient(ingredientToEdit.qte.toString());
      setSelectedUnite(ingredientToEdit.id_unite.toString());
    } else {
      setSelectedProduit('');
      setQteIngredient('');
      setSelectedUnite('');
    }
  }, [ingredientToEdit]);

  // Validation du formulaire d'ingrédient
  const isIngredientFormValid = () => {
    return (
      selectedProduit !== '' && 
      qteIngredient !== '' && 
      parseFloat(qteIngredient) > 0 && 
      selectedUnite !== ''
    );
  };

  // Fonction pour sauvegarder l'ingrédient
  const handleSaveIngredient = async () => {
    if (!isIngredientFormValid() || !recetteId || !bakeryId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      let query;
      
      if (ingredientToEdit) {
        // Requête de mise à jour
        query = `
          UPDATE ingredient 
          SET 
            id_produit = ${selectedProduit},
            qte = ${qteIngredient},
            id_unite = ${selectedUnite}
          WHERE 
            id_ingredient = ${ingredientToEdit.id_ingredient} 
            AND id_boul = ${bakeryId}
          RETURNING 'OK' as update_ingredient
        `;
      } else {
        // Requête d'insertion via la fonction save_ingredient
        query = `SELECT * FROM public.save_ingredient(
          ${bakeryId},
          ${recetteId},
          ${selectedProduit},
          ${qteIngredient},
          ${selectedUnite},
          0
        )`;
      }

      console.log('📤 Envoi de la requête...', query);
      const response = await envoyerRequeteApi<SaveIngredientResponse[]>('boulangerie', query);
      console.log('📦 Réponse:', response);

      const success = 
        (ingredientToEdit && response) || 
        (!ingredientToEdit && response && response.length > 0 && response[0].save_ingredient === 'OK');
      
      if (success) {
        toast({
          title: "Succès",
          description: ingredientToEdit 
            ? "Ingrédient modifié avec succès" 
            : "Ingrédient ajouté avec succès",
        });
        
        // Réinitialiser le formulaire et retourner à la liste
        onCancel();
        
        return true;
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder l'ingrédient",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'ingrédient:', error);
      
      // Vérifier si c'est l'erreur d'ingrédient déjà enregistré
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isIngredientAlreadyExists = errorMessage.includes('Cet ingrédient est déjà enregistré');
      
      toast({
        title: "Erreur",
        description: isIngredientAlreadyExists 
          ? "Cet ingrédient est déjà présent dans la recette" 
          : (ingredientToEdit 
              ? "Impossible de modifier l'ingrédient" 
              : "Impossible d'ajouter l'ingrédient"),
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm flex flex-col h-full">
      <CardContent className="p-4 flex flex-col h-full">
        {/* En-tête fixe */}
        <h3 className="text-lg font-medium text-gray-800 mb-2 bg-white z-10">
          {ingredientToEdit ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
        </h3>
        
        {/* Contenu avec hauteur réduite et sans margin-bottom */}
        <div className="flex-1 overflow-auto max-h-[300px]">
          <div className="space-y-4 p-1">
            {/* Produit */}
            <div className="space-y-1">
              <Label htmlFor="produit" className="text-sm font-medium text-gray-700">Produit</Label>
              <Select 
                value={selectedProduit} 
                onValueChange={setSelectedProduit}
              >
                <SelectTrigger id="produit" className="w-full border border-gray-300 rounded-md">
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent className="max-h-40 overflow-y-auto">
                  <div className="relative">
                    <input
                      className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                      placeholder="Rechercher un produit..."
                      onChange={(e) => {
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
                    {produits.map((produit) => (
                      <SelectItem 
                        key={produit.id_produit} 
                        value={produit.id_produit.toString()}
                        className="py-2 px-3 hover:bg-blue-50 cursor-pointer transition-colors rounded-md"
                      >
                        {produit.nom_produit}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            {/* Quantité */}
            <div className="space-y-1">
              <Label htmlFor="quantite" className="text-sm font-medium text-gray-700">Quantité</Label>
              <Input
                id="quantite"
                type="number"
                step="0.01"
                min="0"
                value={qteIngredient}
                onChange={(e) => setQteIngredient(e.target.value)}
                className="w-full border border-gray-300 rounded-md"
              />
              {(qteIngredient === '' || parseFloat(qteIngredient) <= 0) && (
                <div className="flex items-center text-amber-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>La quantité doit être supérieure à zéro</span>
                </div>
              )}
            </div>
            
            {/* Unité */}
            <div className="space-y-1">
              <Label htmlFor="unite" className="text-sm font-medium text-gray-700">Unité</Label>
              <Select 
                value={selectedUnite} 
                onValueChange={setSelectedUnite}
              >
                <SelectTrigger id="unite" className="w-full border border-gray-300 rounded-md">
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  {unites.map((unite) => (
                    <SelectItem 
                      key={unite.id_unite} 
                      value={unite.id_unite.toString()}
                    >
                      {unite.nom_unite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Boutons fixés en bas - maintenant dans leur propre div en dehors du défilement */}
        <div className="mt-4 pt-2 border-t border-gray-200">
          <div className="flex justify-center gap-4 mt-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              size="sm"
              disabled={isSubmitting}
              className="min-w-24"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSaveIngredient} 
              disabled={!isIngredientFormValid() || isSubmitting || isSaving}
              size="sm"
              className={`min-w-24 ${!isIngredientFormValid() ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
            >
              {isSubmitting || isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enregistrement...</span>
                </div>
              ) : (
                ingredientToEdit ? "Modifier" : "Ajouter"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant principal modal
const AddRecetteModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  articles, 
  sites, 
  produits,
  unites,
  bakeryId, 
  recetteToEdit 
}: AddRecetteModalProps) => {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const isEditMode = !!recetteToEdit;
  
  // États généraux
  const [activeTab, setActiveTab] = useState<string>(TabType.RECETTE);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // États pour les ingrédients
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [ingredientToEdit, setIngredientToEdit] = useState<IngredientResponse | null>(null);
  
  // États pour les dialogues de confirmation
  const [confirmLeaveTab, setConfirmLeaveTab] = useState<{from: string, to: string} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: number, name: string} | null>(null);
  
  // Charger les ingrédients de la recette
  const fetchIngredients = useCallback(async (recetteId: number) => {
    try {
      const query = `
        SELECT * FROM list_ingredients 
        WHERE id_recette = ${recetteId} 
        AND id_boul = ${bakeryId}
        ORDER BY nom_produit
      `;
      const response = await envoyerRequeteApi<IngredientResponse[]>('boulangerie', query);
      setIngredients(response || []);
    } catch (error) {
      console.error('Erreur lors du chargement des ingrédients:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les ingrédients: " + error.message,
          variant: "destructive",
        });
      }
    }
  }, [bakeryId, toast]);
  
  // Initialisation des données si on est en mode édition
  useEffect(() => {
    if (open && recetteToEdit?.id_recette) {
      fetchIngredients(recetteToEdit.id_recette);
    }
  }, [recetteToEdit, open, fetchIngredients]);
  
  // Gestion du changement d'onglet
  const handleTabChange = (newTab: string) => {
    // Vérifier si on est en cours d'édition d'un ingrédient et qu'on veut quitter cet onglet
    if (activeTab === TabType.INGREDIENT_FORM && ingredientToEdit) {
      setConfirmLeaveTab({from: activeTab, to: newTab});
      return;
    }
    
    setActiveTab(newTab);
  };
  
  // Sauvegarder une recette
  const saveRecette = async (recetteData: RecetteFormData) => {
    if (!user || (user.libelle_profil !== "Manager" && user.libelle_profil !== "Gérant")) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour cette action.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      let query;
      
      if (isEditMode && recetteToEdit) {
        // Requête de mise à jour
        query = `SELECT * FROM public.save_recette(
          ${recetteData.selectedSite},
          '${recetteData.nomRecette}',
          ${recetteData.selectedArticle},
          ${recetteData.qteProduction},
          ${recetteData.tempsCuisson},
          ${recetteToEdit?.actif ?? 'true'},
          ${recetteToEdit.id_recette}
        )`;
      } else {
        // Requête d'insertion
        query = `SELECT * FROM public.save_recette(
          ${recetteData.selectedSite},
          '${recetteData.nomRecette}',
          ${recetteData.selectedArticle},
          ${recetteData.qteProduction},
          ${recetteData.tempsCuisson},
          true,
          0
        )`;
      }
      
      const response = await envoyerRequeteApi<SaveRecetteResponse[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].save_recette === 'OK') {
        toast({
          title: "Succès",
          description: isEditMode ? "Recette modifiée avec succès" : "Recette créée avec succès",
        });
        
        // Si c'est une nouvelle recette, récupérer son ID pour pouvoir afficher les ingrédients
        if (!isEditMode) {
          const recetteQuery = `
            SELECT * FROM list_recettes 
            WHERE nom_recette = '${recetteData.nomRecette}' 
            AND id_boul = ${bakeryId} 
            AND id_site = ${recetteData.selectedSite}
            ORDER BY id_recette DESC 
            LIMIT 1
          `;
          
          const recetteResponse = await envoyerRequeteApi<RecetteResponse[]>('boulangerie', recetteQuery);
          
          if (recetteResponse && recetteResponse.length > 0) {
            // Informer le parent du succès
            onSuccess();
            
            // Passer à l'onglet de liste des ingrédients
            setActiveTab(TabType.INGREDIENTS_LIST);
            
            // Afficher un message indiquant à l'utilisateur qu'il peut maintenant ajouter des ingrédients
            toast({
              title: "Information",
              description: "Vous pouvez maintenant ajouter des ingrédients à cette recette.",
            });
          }
        } else {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recette:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: isEditMode ? "Impossible de modifier la recette" : "Impossible de créer la recette",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Supprimer un ingrédient
  const handleDeleteIngredient = async (ingredientId: number) => {
    if (!user || (user.libelle_profil !== "Manager" && user.libelle_profil !== "Gérant")) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour cette action.",
        variant: "destructive",
      });
      return;
    }

    try {
      const query = `
        DELETE FROM ingredient 
        WHERE id_ingredient = ${ingredientId} 
        AND id_boul = ${bakeryId}
        RETURNING 'OK' as delete_ingredient
      `;
      
      const response = await envoyerRequeteApi<{delete_ingredient: string}[]>('boulangerie', query);
      
      if (response && response.length > 0 && response[0].delete_ingredient === 'OK') {
        toast({
          title: "Succès",
          description: "Ingrédient supprimé avec succès",
        });
        
        // Recharger la liste des ingrédients
        if (recetteToEdit?.id_recette) {
          await fetchIngredients(recetteToEdit.id_recette);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ingrédient:', error);
      if (error instanceof ApiError) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'ingrédient",
          variant: "destructive",
        });
      }
    }
  };

  // Handlers pour les actions sur les ingrédients
  const handleAddIngredient = () => {
    setIngredientToEdit(null);
    setActiveTab(TabType.INGREDIENT_FORM);
  };

  const handleEditIngredient = (ingredient: IngredientResponse) => {
    setIngredientToEdit(ingredient);
    setActiveTab(TabType.INGREDIENT_FORM);
  };

  const handleConfirmDeleteIngredient = (ingredient: IngredientResponse) => {
    setConfirmDelete({
      id: ingredient.id_ingredient,
      name: ingredient.nom_produit
    });
  };

  // Si la modal n'est pas ouverte, ne rien afficher
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditMode ? `Modifier la recette: ${recetteToEdit?.nom_recette}` : "Nouvelle Recette"}
            </h2>
            {isEditMode && <p className="text-gray-500">ID: {recetteToEdit?.id_recette}</p>}
          </div>
        </div>
        
        {/* Tabs - seulement affichés en mode édition */}
        {isEditMode && (
          <div className="px-4 border-b">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value={TabType.RECETTE}>Détails de la recette</TabsTrigger>
                <TabsTrigger value={TabType.INGREDIENTS_LIST}>Liste des ingrédients</TabsTrigger>
                <TabsTrigger value={TabType.INGREDIENT_FORM}>Édition ingrédient</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="p-4">
              {/* Onglet Recette */}
              {activeTab === TabType.RECETTE && (
                <RecetteForm
                  articles={articles}
                  sites={sites}
                  recetteToEdit={recetteToEdit}
                  onSave={saveRecette}
                  isSaving={isSaving}
                />
              )}
              
              {/* Onglet Liste des Ingrédients */}
              {activeTab === TabType.INGREDIENTS_LIST && isEditMode && (
                <IngredientsList
                  ingredients={ingredients}
                  onAddIngredient={handleAddIngredient}
                  onEditIngredient={handleEditIngredient}
                  onDeleteIngredient={handleConfirmDeleteIngredient}
                />
              )}
              
              {/* Onglet Édition Ingrédient */}
              {activeTab === TabType.INGREDIENT_FORM && isEditMode && (
                <IngredientForm
                  produits={produits}
                  unites={unites}
                  ingredientToEdit={ingredientToEdit}
                  recetteId={recetteToEdit?.id_recette || 0}
                  bakeryId={bakeryId}
                  onCancel={() => {
                    setIngredientToEdit(null);
                    setActiveTab(TabType.INGREDIENTS_LIST);
                    // Recharger la liste des ingrédients après annulation
                    if (recetteToEdit?.id_recette) {
                      fetchIngredients(recetteToEdit.id_recette);
                    }
                  }}
                  isSaving={isSaving}
                />
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Fermer
          </Button>
          
         
        </div>
      </div>
      
      {/* Dialogue de confirmation pour quitter l'édition d'ingrédient */}
      {confirmLeaveTab && (
        <ConfirmDialog
          isOpen={true}
          title="Modifications non sauvegardées"
          message="Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter cette page ?"
          confirmLabel="Quitter sans sauvegarder"
          variant="warning"
          onConfirm={() => {
            setActiveTab(confirmLeaveTab.to);
            setConfirmLeaveTab(null);
            setIngredientToEdit(null);
          }}
          onCancel={() => setConfirmLeaveTab(null)}
        />
      )}
      
      {/* Dialogue de confirmation pour la suppression */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Confirmation de suppression"
          message={`Êtes-vous sûr de vouloir supprimer l'ingrédient ${confirmDelete.name} ?`}
          confirmLabel="Supprimer"
          variant="danger"
          onConfirm={async () => {
            if (confirmDelete && recetteToEdit?.id_recette) {
              await handleDeleteIngredient(confirmDelete.id);
            }
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default AddRecetteModal;