import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { envoyerRequeteApi } from '@/app/apis/api';
import { format } from 'date-fns';
//gestion des imports usercontext et paramscontext
import { UserContext } from '@/app/contexts/UserContext';
import { ParamsContext } from '@/app/contexts/ParamsContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

import ArticleVenteModal, { ArticlePossible, ArticleVenteDetail, PrixOption } from '@/components/ventes/ArticleVenteModal';
import { SelectList } from '@/components/ui/select-list';

// Props pour le modal
interface AddVenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSiteId?: number;
  defaultDate?: Date;
  onVenteAdded?: () => void;
}

// Interface pour la réponse de l'API get_ventes_possibles
interface GetVentesPossiblesResponseItem {
  get_ventes_possibles: {
    code: number;
    message: string;
    datas: ArticlePossible[];
  };
}

// Interface pour la réponse de l'API save_vente
interface SaveVenteResponseItem {
  save_vente: string; // "OK" en cas de succès
}

const AddVenteModal: React.FC<AddVenteModalProps> = ({
  isOpen,
  onClose,
  defaultSiteId,
  defaultDate,
  onVenteAdded
}) => {
  const { toast } = useToast();
  const { user } = useContext(UserContext);
  const { params: siteParams } = useContext(ParamsContext);

  // 1) États principaux
  const [selectedSite, setSelectedSite] = useState<number>(defaultSiteId || 0);
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate || new Date());
  const [articlesPossibles, setArticlesPossibles] = useState<ArticlePossible[]>([]);
  const [venteDetails, setVenteDetails] = useState<ArticleVenteDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [encaissementManuel, setEncaissementManuel] = useState<boolean>(false);

  // 2) États pour le petit « sous-formulaire » de saisie
  const [showArticleModal, setShowArticleModal] = useState<boolean>(false);
  const [articleToSell, setArticleToSell] = useState<ArticlePossible | null>(null);
  const [qteVente, setQteVente] = useState<number>(0);
  const [prixOption, setPrixOption] = useState<PrixOption>(1); // 1=boutique, 2=livreur, 3=revendeur, 4=libre
  const [puLibre, setPuLibre] = useState<number>(0);        // si prix libre
  const [mtEncaisse, setMtEncaisse] = useState<number>(0);  // Montant encaissé (modifiable)
  const [totalLigne, setTotalLigne] = useState<number>(0);

  // 5) Calcul automatique du total en fonction de la qte, du prix, etc.
  //    Appelé à chaque fois que qte ou prixOption changent
  const recalcTotal = useCallback((newQte: number, newPrixOption: PrixOption, newPuLibre: number): void => {
    if (!articleToSell) return;
    let pu = 0;
    switch (newPrixOption) {
      case 1: pu = articleToSell.pu_boutique; break;
      case 2: pu = articleToSell.pu_livreur;  break;
      case 3: pu = articleToSell.pu_revente;  break;
      case 4: pu = newPuLibre;                break; // prix libre
    }
    const total = (newQte * pu);
    setTotalLigne(total);
    
    // Mettre à jour mtEncaisse seulement si l'utilisateur n'a pas modifié manuellement
    if (!encaissementManuel) {
      setMtEncaisse(total);
    }
  }, [articleToSell, encaissementManuel]);

  const handleMtEncaisseChange = (value: number) => {
    setMtEncaisse(value);
    setEncaissementManuel(true);
  };


  // 6) Effet pour recalculer quand qte ou prixOption changent
  useEffect(() => {
    recalcTotal(qteVente, prixOption, puLibre);
  }, [qteVente, prixOption, puLibre, recalcTotal]);

  // 3) Charger la liste d'articles possibles (via la requête get_ventes_possibles)
  const handleRechercherArticles = async (): Promise<void> => {
    console.log("Début de handleRechercherArticles");
    
    // Vérification du site sélectionné
    if (selectedSite === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner un site",
        variant: "destructive",
      });
      return;
    }
    
    // Récupérer le bakeryId (id_boul) à partir du site sélectionné
    const selectedSiteObject = siteParams?.sites?.find(site => site.id_site === selectedSite);
    if (!selectedSiteObject) {
      toast({
        title: "Erreur",
        description: "Site non trouvé dans la liste des sites",
        variant: "destructive",
      });
      return;
    }
    
    const siteBakeryId = selectedSiteObject.id_boul;
    console.log("Site sélectionné:", selectedSiteObject.nom_site);
    console.log("bakeryId (id_boul):", siteBakeryId);
    
    console.log("Conditions satisfaites, début du chargement");
    setIsLoading(true);
    setArticlesPossibles([]); // Réinitialiser la liste
    
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log("Date formatée:", dateString);
      // L'ordre correct des paramètres est (id_boul, id_site, date)
      const query = `SELECT * FROM get_ventes_possibles(${siteBakeryId}, ${selectedSite}, '${dateString}')`;
      
      console.log("Envoi de la requête:", query);
      const response = await envoyerRequeteApi<GetVentesPossiblesResponseItem[]>('boulangerie', query);
      console.log("Réponse reçue:", response);
      
      // Vérifier si la réponse a la structure attendue
      if (response && 
          Array.isArray(response) && 
          response.length > 0 && 
          response[0].get_ventes_possibles && 
          response[0].get_ventes_possibles.code === 200 && 
          Array.isArray(response[0].get_ventes_possibles.datas)) {
        
        // Extraire les données correctement
        const articlesData = response[0].get_ventes_possibles.datas;
        console.log("Articles extraits:", articlesData.length);
        
        if (articlesData.length > 0) {
          // Regrouper les articles par id_article et totaliser les quantités
          const groupedArticles: { [key: number]: ArticlePossible } = {};
          
          articlesData.forEach(article => {
            const id = article.id_article;
            
            if (groupedArticles[id]) {
              // Si l'article existe déjà, ajouter la quantité
              groupedArticles[id].qte += article.qte;
              // Conserver les autres informations du premier article trouvé
            } else {
              // Sinon, ajouter l'article au groupe
              groupedArticles[id] = { ...article };
            }
          });
          
          // Convertir l'objet en tableau
          const formattedArticles = Object.values(groupedArticles);
          
          // Tri des articles par nom pour faciliter la recherche
          formattedArticles.sort((a, b) => a.nom_article.localeCompare(b.nom_article));
          
          console.log("Articles formatés et regroupés:", formattedArticles.length);
          setArticlesPossibles(formattedArticles);
          
          toast({
            title: "Succès",
            description: `${formattedArticles.length} articles disponibles trouvés`,
            variant: "default",
          });
          return; // Sortir de la fonction après succès
        }
      }
      
      // Si on arrive ici, c'est que la réponse n'a pas la structure attendue ou est vide
      console.log("Réponse vide ou invalide");
      setArticlesPossibles([]);
      toast({
        title: "Information",
        description: "Aucun article disponible trouvé pour ce site et cette date",
      });
      
    } catch (error) {
      console.error("Erreur lors du chargement des articles possibles:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles disponibles. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      console.log("Fin de la fonction, isLoading remis à false");
      setIsLoading(false);
    }
  };

  // 4) Gestion de la sélection d'un article dans la liste
  //    On ouvre un sous-modal pour saisir la quantité, le type de prix, etc.
  const handleSelectArticle = (article: ArticlePossible): void => {
    setArticleToSell(article);
    setQteVente(1); // Par défaut on met 1 au lieu de 0
    setPrixOption(1);  // Par défaut: prix boutique
    setPuLibre(0);
    setMtEncaisse(0);
    setTotalLigne(0);
    setEncaissementManuel(false); // Réinitialiser l'état
    setShowArticleModal(true);
  };

  // 7) Valider l'article sélectionné et l'ajouter au tableau
  const handleAjouterArticle = (venteDetail: ArticleVenteDetail): void => {
    if (!articleToSell || venteDetail.qte <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une quantité valide",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que la quantité vendue ne dépasse pas le stock disponible
    if (venteDetail.qte > articleToSell.qte) {
      toast({
        title: "Erreur",
        description: `La quantité vendue (${venteDetail.qte}) ne peut pas dépasser le stock disponible (${articleToSell.qte})`,
        variant: "destructive",
      });
      return;
    }

    // Ajouter à la liste des articles vendus
    setVenteDetails([...venteDetails, venteDetail]);

    // Fermer le modal de saisie
    setShowArticleModal(false);
    setArticleToSell(null);

    toast({
      title: "Article ajouté",
      description: `${venteDetail.qte} ${venteDetail.nom_article} ajouté(s) à la vente`,
    });
  };

  // 8) Supprimer un article déjà ajouté dans le tableau (si l'utilisateur se trompe)
  const handleSupprimerArticle = (index: number): void => {
    const newDetails = [...venteDetails];
    newDetails.splice(index, 1);
    setVenteDetails(newDetails);
  };

  // 9) Sauvegarder la vente complète
  const handleSaveVente = async (): Promise<void> => {
    if (venteDetails.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun article n'a été ajouté à la vente",
        variant: "destructive",
      });
      return;
    }
  
    // Activer l'indicateur de sauvegarde
    setIsSaving(true);
  
    try {
      // Formater la date
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // ID de l'agent qui fait la vente
      const idAgent = user?.id_agent || 0;
      
      // Construire les requêtes SQL pour chaque détail
      const detailsRequetes = [];
      
      for (const detail of venteDetails) {
        // Déterminer l'ID du client (si fourni ou 0 par défaut)
        const idClient = detail.id_client || 0;
        
        // Déterminer le type de vente (si fourni ou utiliser type_prix par défaut)
        const idTypeVente = detail.id_type_vente || detail.type_prix;
        const val_neutre = '#';
        // Ajouter la requête SQL pour ce détail
        const detailSql = `
          INSERT INTO detail_vente (id_site, id_type, id_article, qte, pu, id_vente, id_client, mt_encaisse)
          VALUES (
            ${selectedSite},
            ${idTypeVente},
            ${detail.id_article},
            ${detail.qte},
            ${detail.pu},
            ${val_neutre},
            ${idClient},
            ${detail.mt_encaisse}
          )
        `;
        
        detailsRequetes.push(detailSql);
      }
      
      // Combiner toutes les requêtes détaillées en une seule chaîne
      const detailSql = detailsRequetes.join('; ');
      
      // Échapper les apostrophes simples pour éviter les erreurs SQL
      const detailSqlEscaped = detailSql.replace(/'/g, "''");
      console.log("requete de detail", detailSqlEscaped)
      // Créer la requête principale qui inclut tous les détails
      const sql = `
        SELECT * FROM save_vente(${selectedSite}, '${dateString}', '${detailSqlEscaped}', ${idAgent})
      `;
      console.log("requete de sauvegarde", sql)
      // Envoyer une seule requête à l'API
      const saveResponse = await envoyerRequeteApi<SaveVenteResponseItem[]>('boulangerie', sql);
      console.log("requete de sauvegarde", saveResponse)
      if (!saveResponse || !saveResponse[0] || saveResponse[0].save_vente !== "OK") {
        throw new Error("Erreur lors de la sauvegarde de la vente");
      }
      
      toast({
        title: "Succès",
        description: `Vente enregistrée avec succès pour le site ${siteParams?.sites?.find(s => s.id_site === selectedSite)?.nom_site || selectedSite}`,
      });
      
      // Fermer le modal et appeler le callback de succès
      onClose();
      if (onVenteAdded) onVenteAdded();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la vente:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de la vente",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSave = () => {
    handleSaveVente();
    setShowConfirmation(false);
  };

  const handleCancelSave = () => {
    setShowConfirmation(false);
  };

  // Calcul du total de la vente
  const totalVente = venteDetails.reduce((sum, detail) => sum + detail.mt_ligne, 0);
  const totalEncaisse = venteDetails.reduce((sum, detail) => sum + detail.mt_encaisse, 0);

  // 10) Rendu du composant
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">Saisie nouvelle vente</DialogTitle>
        </DialogHeader>

        {/* Zone de sélection du site, date, et boutons Annuler / Sauver */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
         {/* Par ceci */}
            <div className="flex-1">
              <SelectList
                label="Site"
                items={siteParams?.sites?.map((site) => ({
                  id: site.id_site,
                  label: site.nom_site,
                  id_boul: site.id_boul
                })) || []}
                value={selectedSite}
                onChange={(value) => setSelectedSite(value as number || 0)}
                placeholder="-- Choisir un site --"
                required
                searchable={true}
                className="w-full"
              />
            </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Date:</label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border text-gray-500 p-2 rounded text-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="border-red-500 text-red-600 hover:bg-red-50"
              disabled={isSaving}
            >
              Annuler vente
            </Button>
            <Button 
              onClick={handleConfirmation} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSaving || venteDetails.length === 0}
            >
              {isSaving ? "Sauvegarde en cours..." : "Sauver vente"}
            </Button>
          </div>
        </div>

        {/* Bouton pour charger les articles possibles */}
        <div className="mb-4">
          <Button 
            variant="default" 
            onClick={() => {
              console.log("Bouton cliqué");
              handleRechercherArticles();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recherche en cours...
              </span>
            ) : (
              "Rechercher les articles disponibles"
            )}
          </Button>
        </div>

        {/* Affichage des totaux */}
        {venteDetails.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex justify-between">
              <span className="font-medium text-green-900">Total vente:</span>
              <span className="font-bold text-green-900">{totalVente.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between ">
              <span className="font-medium text-green-700">Total encaissé:</span>
              <span className="font-bold text-green-700">{totalEncaisse.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        {/* Select list (avec recherche) */}
        <div className="mb-4">
  <SelectList
    label="Sélectionner un article"
    items={articlesPossibles.map((article) => ({
      id: article.id_article,
      label: article.nom_article,
      ...article // pour conserver toutes les autres propriétés, y compris qte
    }))}
    value={null} // Nous gardons la valeur à null car nous utilisons handleSelectArticle au lieu de stocker l'article sélectionné
    onChange={(_, item) => item && handleSelectArticle(item as ArticlePossible)}
    placeholder="Sélectionner un article"
    searchPlaceholder="Rechercher un article..."
    renderItem={(article, isSelected) => (
      <div className="flex justify-between w-full">
        <span className={`${isSelected ? "font-medium" : ""}`}>{article.label}</span>
        <span className="text-sm ml-2">Dispo = {article.qte}</span>
      </div>
    )}
  />
</div>

        {/* Tableau des articles déjà sélectionnés */}
        {venteDetails.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className=" font-normal bg-red-500 text-white">
                <tr>
                  <th className="p-2 border">Article</th>
                  <th className="p-2 border">Client</th>
                  <th className="p-2 border">Quantité</th>
                  <th className="p-2 border">PU</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border">Encaissé</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {venteDetails.map((detail, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border">{detail.nom_article}</td>
                    <td className="p-2 border">
                      <Badge variant="outline" className="font-normal">
                        {detail.client || "Non spécifié"}
                      </Badge>
                    </td>
                    <td className="p-2 border text-center">{detail.qte}</td>
                    <td className="p-2 border text-right">{detail.pu.toLocaleString()}</td>
                    <td className="p-2 border text-right">{detail.mt_ligne.toLocaleString()}</td>
                    <td className="p-2 border text-right">{detail.mt_encaisse.toLocaleString()}</td>
                    <td className="p-2 border text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSupprimerArticle(index)}
                        className="text-red-600 hover:bg-red-50 p-1 h-7 w-7"
                      >
                        X
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal pour ajouter un article */}
        {showArticleModal && articleToSell && (
          <ArticleVenteModal
            article={articleToSell}
            qteVente={qteVente}
            prixOption={prixOption}
            puLibre={puLibre}
            mtEncaisse={mtEncaisse}
            totalLigne={totalLigne}
            onValiderArticle={handleAjouterArticle}
            onMtEncaisseChange={handleMtEncaisseChange}
            onClose={() => {
              setShowArticleModal(false);
              setArticleToSell(null);
            }}
          />
        )}
        {showConfirmation && (
          <Dialog open={showConfirmation} onOpenChange={handleCancelSave}>
            <DialogContent>
              <DialogTitle>Confirmation de sauvegarde</DialogTitle>
              <p >Êtes-vous sûr de vouloir sauvegarder la vente ?</p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleCancelSave}>
                  Annuler
                </Button>
                <Button variant="default" onClick={handleConfirmSave}>
                  Sauvegarder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddVenteModal;