'use client';

import { useEffect } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  nom_recette: z.string().min(1, "Le nom est requis"),
  id_article: z.string().min(1, "L'article est requis"),
  qte_produite: z.string().min(1, "La quantité est requise"),
  temps_cuisson: z.string().min(1, "Le temps de cuisson est requis"),
  id_site: z.string().min(1, "Le site est requis"),
});

interface SaveRecetteResponse {
  save_recette: string;
}

interface Article {
  id_article: number;
  nom_article: string;
}

interface Site {
  id_site: number;
  nom_site: string;
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

interface AddRecetteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  articles: Article[];
  sites: Site[];
  bakeryId: number;
  recetteToEdit?: RecetteResponse;
}

export default function AddRecetteModal({ 
  open, 
  onClose, 
  onSuccess, 
  articles, 
  sites, 
  bakeryId, 
  recetteToEdit 
}: AddRecetteModalProps) {
  const { toast } = useToast();
  const isEditMode = !!recetteToEdit;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom_recette: "",
      id_article: "",
      qte_produite: "",
      temps_cuisson: "60",
      id_site: "",
    },
  });

  // Remplir le formulaire avec les valeurs existantes lors de l'édition
  useEffect(() => {
    if (recetteToEdit) {
      form.reset({
        nom_recette: recetteToEdit.nom_recette,
        id_article: recetteToEdit.id_article.toString(),
        qte_produite: recetteToEdit.qte_prod.toString(),
        temps_cuisson: recetteToEdit.temps_cuisson.toString(),
        id_site: recetteToEdit.id_site.toString(),
      });
    } else {
      form.reset({
        nom_recette: "",
        id_article: "",
        qte_produite: "",
        temps_cuisson: "60",
        id_site: "",
      });
    }
  }, [recetteToEdit, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let query;
      
      if (isEditMode && recetteToEdit) {
        // Requête de mise à jour via la fonction save_recette
        query = `SELECT * FROM public.save_recette(
          ${values.id_site},
          '${values.nom_recette}',
          ${values.id_article},
          ${values.qte_produite},
          ${values.temps_cuisson},
          ${recetteToEdit?.actif ?? 'true'},
          ${recetteToEdit.id_recette}
        )`;
        
        console.log('📤 Envoi de la requête save_recette...', query, bakeryId);
        const response = await envoyerRequeteApi<SaveRecetteResponse[]>('boulangerie', query);
        console.log('📦 Réponse save_recette:', response);

        if (response && response.length > 0 && response[0].save_recette === 'OK') {
          console.log('✅ Recette sauvegardée avec succès');
          toast({
            title: "Succès",
            description: "Recette modifiée avec succès",
          });
        }
      } else {
        // Requête d'insertion via la fonction save_recette
        query = `SELECT * FROM public.save_recette(
          ${values.id_site},
          '${values.nom_recette}',
          ${values.id_article},
          ${values.qte_produite},
          ${values.temps_cuisson},
          true,
          0
        )`;

        console.log('📤 Envoi de la requête save_recette...', query);
        const response = await envoyerRequeteApi<SaveRecetteResponse[]>('boulangerie', query);
        console.log('📦 Réponse save_recette:', response);

        if (response && response.length > 0 && response[0].save_recette === 'OK') {
          console.log('✅ Recette sauvegardée avec succès');
          toast({
            title: "Succès",
            description: "Recette créée avec succès",
          });
        }
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors de la sauvegarde:', error.message);
        toast({
          title: "Erreur",
          description: isEditMode 
            ? "Impossible de modifier la recette" 
            : "Impossible de créer la recette",
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
            {isEditMode ? "Modifier la recette" : "Nouvelle Recette"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom_recette"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la recette</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_article"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un article" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {articles?.map((article) => (
                        <SelectItem
                          key={article.id_article}
                          value={article.id_article.toString()}
                        >
                          {article.nom_article}
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
              name="qte_produite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité produite</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temps_cuisson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temps de cuisson (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites?.map((site) => (
                        <SelectItem
                          key={site.id_site}
                          value={site.id_site.toString()}
                        >
                          {site.nom_site}
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
                {isEditMode ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}