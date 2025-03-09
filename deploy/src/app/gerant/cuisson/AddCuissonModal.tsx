'use client';

import { useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { ParamsContext, Site } from '@/app/contexts/ParamsContext';
import { UserContext } from '@/app/contexts/UserContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Loader2 } from 'lucide-react';

interface SaveCuissonResponse {
  save_new_cuisson: string;
}

const formSchema = z.object({
  date_cuisson: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Date invalide",
  }),
  id_site: z.string().min(1, "Veuillez sélectionner un site"),
});

interface AddCuissonModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  siteID: number;
}

export default function AddCuissonModal({
  open,
  onClose,
  onSuccess,
  siteID,
}: AddCuissonModalProps) {
  const { toast } = useToast();
  const { params } = useContext(ParamsContext);
  const { user } = useContext(UserContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sites = params?.sites || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date_cuisson: format(new Date(), 'yyyy-MM-dd'),
      id_site: '',
    },
  });
  // ajout d'un site par defaut si le profil de l'utilisateur est un chef de site
  useEffect(() => {
    if (user?.libelle_profil !== 'Manager') {
      form.setValue('id_site', siteID.toString());
      }
  }, [user, form, siteID]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Utiliser la fonction save_new_cuisson avec les paramètres appropriés
      const query = `
        SELECT * FROM save_new_cuisson(
          ${values.id_site},
          '${values.date_cuisson}'::date,
          ${user?.id_agent || 'NULL'}
        )
      `;

      console.log('Envoi de la requête save_new_cuisson...', query);
      const response = await envoyerRequeteApi<SaveCuissonResponse[]>('boulangerie', query);
      console.log('Réponse save_new_cuisson:', response);

      if (response && response.length > 0) {
        const result = response[0].save_new_cuisson;
        
        if (result.startsWith('OK')) {
          const cuissonId = result.split('#')[1];
          
          // Différencier entre nouveau et existant
          if (result.includes('exist')) {
            toast({
              title: "Information",
              description: `Une cuisson existe déjà pour cette date et ce site (Cuisson N°${cuissonId})`,
            });
          } else {
            toast({
              title: "Succès",
              description: `Cuisson N°${cuissonId} ajoutée avec succès`,
            });
          }
          
          onSuccess();
          onClose();
        } else {
          // Afficher l'erreur retournée par la fonction
          toast({
            title: "Erreur",
            description: result,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Erreur lors de la sauvegarde:', error.message);
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'ajouter la cuisson",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire avant de fermer
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleCancel();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Nouvelle cuisson</DialogTitle>
          <DialogDescription className="text-white-500">
            Ajouter une nouvelle cuisson pour un site spécifique.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date_cuisson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Date de cuisson</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="date"
                        {...field}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        min="2000-01-01"
                        className="pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_site"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Site</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || user?.libelle_profil !== 'Manager'}
                    
                  >
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                type="button"
                disabled={isSubmitting}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className={`${!form.formState.isValid ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  'Valider'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}