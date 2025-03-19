'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Clock, 
  Info, 
  Edit, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

import AddRecetteModal from './AddRecetteModal';
import AddIngredientModal from './AddIngredientModal';
import { useToast } from '@/components/ui/use-toast';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';

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
  tot_ingredients: number;
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

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recetteName: string;
}

interface ConfirmDeleteIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ingredientName: string;
}

// Composant modal de confirmation de suppression de recette
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, recetteName }: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
        <div className="flex items-center text-amber-600 mb-4">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">Confirmation de suppression</h2>
        </div>
        
        <p className="mb-6">
          Êtes-vous sûr de vouloir supprimer la recette <span className="font-bold">{recetteName}</span> ? 
          Cette action est irréversible.
        </p>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};

// Composant modal de confirmation de suppression d'ingrédient
const ConfirmDeleteIngredientModal = ({ isOpen, onClose, onConfirm, ingredientName }: ConfirmDeleteIngredientModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
        <div className="flex items-center text-amber-600 mb-4">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-lg font-semibold">Confirmation de suppression</h2>
        </div>
        
        <p className="mb-6">
          Êtes-vous sûr de vouloir supprimer l&apos;ingrédient <span className="font-bold">{ingredientName}</span> ? 
          Cette action est irréversible.
        </p>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function RecettesPage() {
  const { user } = useContext(UserContext);
  const { params } = useContext(ParamsContext);
  console.log('📊 Paramètres reçus dans page.tsx:', params);
  console.log('📊 Les unités dans params:', params?.unites);

  const [recettes, setRecettes] = useState<RecetteResponse[]>([]);
  const [ingredients, setIngredients] = useState<IngredientResponse[]>([]);
  const [selectedRecette, setSelectedRecette] = useState<RecetteResponse | null>(null);
  const [showAddRecette, setShowAddRecette] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [editRecette, setEditRecette] = useState<RecetteResponse | null>(null);
  const [editIngredient, setEditIngredient] = useState<IngredientResponse | null>(null);
  const [deleteRecette, setDeleteRecette] = useState<RecetteResponse | null>(null);
  const [deleteIngredient, setDeleteIngredient] = useState<IngredientResponse | null>(null);
  const { toast } = useToast();
  const inputTextStyle = "text-[#7e630c]";

  const loadRecettes = useCallback(async () => {
    if (!user?.bakeryId) return;
    
    try {
      const query = `
        SELECT  r.id_recette , r.id_boul , r.id_site , r.nom_site , r.nom_type ,r.id_article , r.nom_article , r.nom_recette ,r.qte_prod ,r.temps_cuisson, r.tot_ingredients 
        FROM list_recettes r
        WHERE r.id_boul = ${user.bakeryId}
        ORDER BY r.nom_recette ASC
      `;
      const response = await envoyerRequeteApi<RecetteResponse[]>('boulangerie', query);
      setRecettes(response || []);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors du chargement des recettes:', error.message);
        toast({
          title: "Erreur",
          description: "Impossible de charger les recettes",
          variant: "destructive",
        });
      }
    }
  }, [user?.bakeryId, toast]);

  const loadIngredients = useCallback(async (id_recette: number) => {
    if (!user?.bakeryId) return;

    try {
      const query = `
        SELECT i.*
        FROM public.list_ingredients i
        WHERE i.id_boul = ${user.bakeryId} 
        AND i.id_recette = ${id_recette}
        ORDER BY i.nom_produit ASC
      `;
      console.log('📤 Envoi de la requête load_ingredients...', query);
      const response = await envoyerRequeteApi<IngredientResponse[]>('boulangerie', query);
      setIngredients(response || []);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors du chargement des ingrédients:', error.message);
        toast({
          title: "Erreur",
          description: "Impossible de charger les ingrédients",
          variant: "destructive",
        });
      }
    }
  }, [user?.bakeryId, toast]);

  const deleteRecetteHandler = async () => {
    if (!user?.bakeryId || !deleteRecette) return;

    try {
      const query = `
        DELETE FROM recette 
        WHERE id_boul = ${user.bakeryId} 
        AND id_recette = ${deleteRecette.id_recette}
      `;
      
      await envoyerRequeteApi('boulangerie', query);
      
      // Recharger les recettes après suppression
      loadRecettes();
      
      // Réinitialiser les sélections
      if (selectedRecette?.id_recette === deleteRecette.id_recette) {
        setSelectedRecette(null);
        setIngredients([]);
      }
      
      toast({
        title: "Suppression réussie",
        description: `La recette "${deleteRecette.nom_recette}" a été supprimée.`,
      });
      
      // Fermer le modal de confirmation
      setDeleteRecette(null);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors de la suppression de la recette:', error.message);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la recette",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteIngredient = async (ingredient: IngredientResponse) => {
    try {
      const query = `SELECT * FROM public.del_ingredient(${ingredient.id_ingredient})`;
      const response = await envoyerRequeteApi<{ del_ingredient: string }[]>('boulangerie', query);

      if (response && response[0]?.del_ingredient === 'OK') {
        toast({
          title: "Succès",
          description: "Ingrédient supprimé avec succès",
        });
        // Rafraîchir la liste des ingrédients
        if (selectedRecette) {
          loadIngredients(selectedRecette.id_recette);
        }
      } else {
        const errorMessage = response?.[0]?.del_ingredient || 'Erreur lors de la suppression';
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'ingrédient",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.bakeryId) {
      loadRecettes();
    }
  }, [user?.bakeryId, loadRecettes]);

  const handleCardClick = (recette: RecetteResponse) => {
    setSelectedRecette(recette);
    loadIngredients(recette.id_recette);
  };

  // Empêcher la propagation d'événements pour les boutons d'action
  const handleActionClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddRecette(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Recette
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="p-4 border-b bg-muted/40">
          <h3 className="text-lg font-semibold">Liste des recettes</h3>
        </div>
        {/* Zone de défilement avec une hauteur fixe */}
        <div className="h-[400px] overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recettes.map((recette) => (
              <div 
                key={recette.id_recette}
                className={`
                  p-4 rounded-md border shadow-sm cursor-pointer 
                  hover:bg-muted/50 transition-colors
                  ${selectedRecette?.id_recette === recette.id_recette ? 'border-2 border-[#a1170e]' : ''}
                `}
                onClick={() => handleCardClick(recette)}
              >
                {/* En-tête de la carte avec boutons d'action */}
                <div className="mb-3 flex justify-between items-start">
                  <h4 className="text-[#a1170e] text-lg font-medium">{recette.nom_recette}</h4>
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      onClick={(e) => handleActionClick(e, () => setEditRecette(recette))}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800 transition-colors"
                      onClick={(e) => handleActionClick(e, () => setDeleteRecette(recette))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Contenu de la carte */}
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#7e630c]">Article:</span>
                    <span className={inputTextStyle}>{recette.nom_article}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#7e630c]">Type:</span>
                    <span className={inputTextStyle}>{recette.nom_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#7e630c]">Site:</span>
                    <span className={inputTextStyle}>{recette.nom_site}</span>
                  </div>
                </div>
                
                {/* Pied de la carte */}
                <div className="pt-2 border-t flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{recette.temps_cuisson} min</span>
                  </div>
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    <span>Qté: {recette.qte_prod}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRecette && (
        <div className="rounded-md border">
          <div className="p-4 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#a1170e]" >
                Ingrédients de {selectedRecette.nom_recette} (Total: {ingredients.length})
              </h3>
              <Button onClick={() => setShowAddIngredient(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un ingrédient
              </Button>
            </div>
          </div>
          
          {/* Tableau personnalisé pour les ingrédients */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#b71c1c] text-white">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Produit</th>
                  <th className="py-3 px-4 text-center font-semibold">Quantité</th>
                  <th className="py-3 px-4 text-center font-semibold">Unité</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      Aucun ingrédient trouvé pour cette recette
                    </td>
                  </tr>
                ) : (
                  ingredients.map((ingredient, index) => (
                    <tr 
                      key={ingredient.id_ingredient} 
                      className={`
                        border-b hover:bg-gray-50 
                        ${index % 2 === 0 ? 'bg-white text-[#7e630c]' : 'bg-[#f9e0e0] text-[#7e630c]'}
                      `}
                    >
                      <td className="py-3 px-4 font-medium">{ingredient.nom_produit}</td>
                      <td className="py-3 px-4 text-center">{ingredient.qte}</td>
                      <td className="py-3 px-4 text-center">{ingredient.nom_unite}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            onClick={() => setEditIngredient(ingredient)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            onClick={() => setDeleteIngredient(ingredient)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddRecette && (
        <AddRecetteModal
          open={showAddRecette}
          onClose={() => setShowAddRecette(false)}
          onSuccess={() => {
            loadRecettes();
            setShowAddRecette(false);
          }}
          articles={params?.articles || []}
          sites={params?.sites || []}
          bakeryId={user?.bakeryId || 0}
        />
      )}

      {editRecette && (
        <AddRecetteModal
          open={!!editRecette}
          onClose={() => setEditRecette(null)}
          onSuccess={() => {
            loadRecettes();
            setEditRecette(null);
          }}
          articles={params?.articles || []}
          sites={params?.sites || []}
          bakeryId={user?.bakeryId || 0}
          recetteToEdit={editRecette}
        />
      )}

      {(showAddIngredient || editIngredient) && selectedRecette && (
        <AddIngredientModal
          open={showAddIngredient || !!editIngredient}
          onClose={() => {
            setShowAddIngredient(false);
            setEditIngredient(null);
          }}
          onSuccess={() => {
            loadIngredients(selectedRecette.id_recette);
            setShowAddIngredient(false);
            setEditIngredient(null);
          }}
          recette={selectedRecette}
          produits={params?.produits || []}
          unites={params?.unites?.map(u => ({
            id_unite: u.id_type,
            nom_unite: u.libelle
          })) || []}
          bakeryId={user?.bakeryId || 0}
          ingredientToEdit={editIngredient}
        />
      )}

      {/* Modal de confirmation de suppression de recette */}
      <ConfirmDeleteModal
        isOpen={!!deleteRecette}
        onClose={() => setDeleteRecette(null)}
        onConfirm={deleteRecetteHandler}
        recetteName={deleteRecette?.nom_recette || ""}
      />

      {/* Modal de confirmation de suppression d'ingrédient */}
      <ConfirmDeleteIngredientModal
        isOpen={!!deleteIngredient}
        onClose={() => setDeleteIngredient(null)}
        onConfirm={() => {
          if (deleteIngredient) {
            handleDeleteIngredient(deleteIngredient);
            setDeleteIngredient(null);
          }
        }}
        ingredientName={deleteIngredient?.nom_produit || ""}
      />
    </div>
  );
}