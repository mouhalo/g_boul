'use client';

import { useContext, useEffect } from 'react';
import { format } from 'date-fns';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { ParamsContext, Site } from '@/app/contexts/ParamsContext';
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

interface SaveCuissonResponse {
  save_cuisson: string;
}

export interface Cuisson {
  id_cuisson: number;
  date_cuisson: string;
  id_site: number;
  tot_produit: number;
  nom_agent: string;
}

const formSchema = z.object({
  date_cuisson: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Date invalide",
  }),
  id_site: z.string(),
});

interface AddEditCuissonProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bakeryId: number;
  uneCuisson?: Cuisson;
}

export default function AddEditCuisson({
  open,
  onClose,
  onSuccess,
  bakeryId,
  uneCuisson,
}: AddEditCuissonProps) {
  const { toast } = useToast();
  const { params } = useContext(ParamsContext);
  const sites = params?.sites || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date_cuisson: format(new Date(), 'yyyy-MM-dd'),
      id_site: '',
    },
  });

  useEffect(() => {
    if (uneCuisson) {
      form.reset({
        date_cuisson: format(new Date(uneCuisson.date_cuisson), 'yyyy-MM-dd'),
        id_site: uneCuisson.id_site.toString(),
      });
    }
  }, [uneCuisson, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let query;
      if (uneCuisson) {
        // Update existing cuisson
        query = `
          UPDATE cuisson 
          SET date_cuisson = '${values.date_cuisson}',
              id_site = ${values.id_site}
          WHERE id_cuisson = ${uneCuisson.id_cuisson}
          RETURNING 'OK' as save_cuisson
        `;
      } else {
        // Insert new cuisson
        query = `
          INSERT INTO cuisson (id_boul, date_cuisson, id_site)
          VALUES (
            ${bakeryId},
            '${values.date_cuisson}',
            ${values.id_site}
          )
          RETURNING 'OK' as save_cuisson
        `;
      }

      console.log(' Envoi de la requête...', query);
      const response = await envoyerRequeteApi<SaveCuissonResponse[]>('boulangerie', query);
      console.log(' Réponse:', response);

      if (response && response.length > 0 && response[0].save_cuisson === 'OK') {
        toast({
          title: "Succès",
          description: uneCuisson ? "Cuisson modifiée avec succès" : "Cuisson ajoutée avec succès",
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(' Erreur lors de la sauvegarde:', error.message);
        toast({
          title: "Erreur",
          description: uneCuisson ? "Impossible de modifier la cuisson" : "Impossible d'ajouter la cuisson",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{uneCuisson ? 'Modifier la cuisson' : 'Nouvelle cuisson'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date_cuisson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de cuisson</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      min="2000-01-01"
                    />
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
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites.map((site: Site) => (
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">
                Valider
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}