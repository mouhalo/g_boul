'use client';

import { useEffect } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface Produit {
  id_produit: number;
  nom_produit: string;
}

interface Unite {
  id_unite: number;
  nom_unite: string;
}

interface SaveIngredientResponse {
  save_ingredient: string;
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

const formSchema = z.object({
  id_produit: z.string(),
  qte: z.string(),
  id_unite: z.string(),
});

interface AddIngredientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recette: RecetteResponse;
  produits: Produit[];
  unites: Unite[];
  bakeryId: number;
  ingredientToEdit?: IngredientResponse | null;
}

export default function AddIngredientModal({
  open,
  onClose,
  onSuccess,
  recette,
  produits,
  unites,
  bakeryId,
  ingredientToEdit
}: AddIngredientModalProps) {
  const { toast } = useToast();
  const isEditMode = !!ingredientToEdit;

  console.log('Unités reçues:', unites);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_produit: "",
      qte: "",
      id_unite: "",
    },
  });

  // Remplir le formulaire avec les valeurs existantes lors de l'édition
  useEffect(() => {
    if (ingredientToEdit) {
      form.reset({
        id_produit: ingredientToEdit.id_produit.toString(),
        qte: ingredientToEdit.qte.toString(),
        id_unite: ingredientToEdit.id_unite.toString(),
      });
    } else {
      form.reset({
        id_produit: "",
        qte: "",
        id_unite: "",
      });
    }
  }, [ingredientToEdit, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let query;
      
      if (isEditMode && ingredientToEdit) {
        // Requête de mise à jour
        query = `
          UPDATE ingredient 
          SET 
            id_produit = ${values.id_produit},
            qte = ${values.qte},
            id_unite = ${values.id_unite}
          WHERE 
            id_ingredient = ${ingredientToEdit.id_ingredient} 
            AND id_boul = ${bakeryId}
          RETURNING 'OK' as update_ingredient
        `;
      } else {
        // Requête d'insertion via la fonction save_ingredient
        query = `SELECT * FROM public.save_ingredient(
          ${bakeryId},
          ${recette.id_recette},
          ${values.id_produit},
          ${values.qte},
          ${values.id_unite}
        )`;
      }

      console.log('📤 Envoi de la requête...', query);
      const response = await envoyerRequeteApi<SaveIngredientResponse[]>('boulangerie', query);
      console.log('📦 Réponse:', response);

      if (
        (isEditMode && response) || 
        (!isEditMode && response && response.length > 0 && response[0].save_ingredient === 'OK')
      ) {
        toast({
          title: "Succès",
          description: isEditMode 
            ? "Ingrédient modifié avec succès"
            : "Ingrédient ajouté avec succès",
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors de la sauvegarde:', error.message);
        toast({
          title: "Erreur",
          description: isEditMode 
            ? "Impossible de modifier l'ingrédient"
            : "Impossible d'ajouter l'ingrédient",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id_produit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {produits.map((produit) => (
                        <SelectItem
                          key={produit.id_produit}
                          value={produit.id_produit.toString()}
                        >
                          {produit.nom_produit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Entrer la quantité"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_unite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unité</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} type="button">
                Annuler
              </Button>
              <Button type="submit">
                {isEditMode ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
