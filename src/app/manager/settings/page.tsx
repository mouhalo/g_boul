'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useLogin from '@/app/hooks/useLogin';
import { AppParams } from '@/app/contexts/ParamsContext';
import { motion } from 'framer-motion';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import Image from 'next/image';
import AddEditSite from './AddEditSite';
import AddEditArticle from './AddEditArticle';
import AddEditFournisseur from './AddEditFournisseur';
import AddEditClient from './AddEditClient';
import AddEditProduit from './AddEditProduit';
import AddEditAgent from './AddEditAgent'; // Importer le composant AddEditAgent
import { 
  Upload, Truck,
  Edit2, 
  Trash2, 
  Building2,
  Edit,
  Store,
  AtSign,
  Phone,
  MapPin,
  User,
  Calendar,
  Tag,
  Package,
  Users,
  Scale,
  Cookie,
  Settings2,
  Receipt,
  DollarSign,
  ShoppingCart,
  UserCircle,
  Plus,
  ChevronRight,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { useToast } from "@/components/ui/toast";

// Types existants
interface Site {
  id_site: number;
  id_boul: number;
  code_site: string;
  adresse: string;
  actif: boolean;
  nom_site: string;
  tel: string;
  nom_gerant: string;
}

interface Settings {
  id_boul: number;
  nom_commercial: string;
  sigle: string;
  nom_gerant: string;
  adresse: string;
  tel_gerant: string;
  actif: boolean;
  email: string;
  control_stock: boolean;
  annee_encours: string;
  logo: string;
}

interface Article {
  id_article: number;
  nom_article: string;
  nom_type: string;
  id_type: number;
  pu_livreur: number;
  pu_boutique: number;
  pu_revente: number;
  nb_jour: number;
  id_site: number;
}

interface Produit {
  id_produit: number;
  nom_produit: string;
  id_unite: number;
  nom_unite: string;
}

interface Client {
  id_client: number;
  id_site: number;
  nom_client: string;
  nom_type: string;
  id_type: number;
  tel_client: string;
  adresse: string;
  actif: boolean;
}

interface Fournisseur {
  id_fournisseur: number;
  nom_fournisseur: string;
  id_boul: number;
  tel_fournisseur: string;
  adresse: string;
  email: string;
  actif: boolean;
}

interface Agent {
  id_agent: number;
  nom_agent: string;
  id_type_agent: number;
  id_site: number;
  id_profil: number;
  nom_site: string;
  libelle_profil: string;
  tel_agent?: string;
  login_agent?: string;
  agent_actif?: boolean;
}

interface TypeVariable {
  id_type: number;
  libelle: string;
  nom_variable: string;
}

type MenuSection = 
  | 'boulangerie'
  | 'sites'
  | 'articles'
  | 'clients'
  | 'fournisseurs'
  | 'produits'
  | 'unites'
  | 'typesCuisson'
  | 'typesUnite'
  | 'typesRecette'
  | 'typesProfil'
  | 'typesDepense'
  | 'typesVente'
  | 'typesClient'
  | 'agents';

interface MenuItem {
  id: MenuSection;
  label: string;
  icon: React.ReactNode;
}

type DeletableItem = TypeVariable | Site | Article | Client | Produit | Fournisseur | Agent;

export default function SettingsPage() {
  const { user, params, setParams } = useLogin();

  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<MenuSection>('boulangerie');
  const [selectedArticleType, setSelectedArticleType] = useState<number | 'all'>('all');
  const [selectedClientType, setSelectedClientType] = useState<number | 'all'>('all');
  const [selectedProduitUnite, setSelectedProduitUnite] = useState<number | 'all'>('all');
  const [selectedAgentProfil, setSelectedAgentProfil] = useState<number | 'all'>('all');
  
  // État pour la valeur saisie par l'utilisateur (mise à jour immédiatement)
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  // État "debounced" pour le filtrage effectif (mise à jour après un délai)
  const [searchText, setSearchText] = useState<string>('');
  
  // Référence pour le timer de debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction pour appliquer le debouncing à la recherche
  const handleSearchInputChange = useCallback((value: string) => {
    // Mettre à jour immédiatement la valeur affichée
    setSearchInputValue(value);
    
    // Annuler le timer précédent s'il existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Créer un nouveau timer pour mettre à jour la valeur de recherche après un délai
    debounceTimerRef.current = setTimeout(() => {
      setSearchText(value);
    }, 300); // Délai de 300ms
  }, []);
  
  // Nettoyage du timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Réinitialiser tous les filtres lors du changement de section
  useEffect(() => {
    setSearchInputValue('');
    setSearchText('');
    setSelectedArticleType('all');
    setSelectedClientType('all');
    setSelectedProduitUnite('all');
    setSelectedAgentProfil('all');
  }, [activeSection]);
  
  // États pour les modaux
  const [editingType, setEditingType] = useState<TypeVariable | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newTypeLibelle, setNewTypeLibelle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DeletableItem | null>(null);

  const [settings, setSettings] = useState<Settings>({
    id_boul: 0,
    nom_commercial: '',
    sigle: '',
    nom_gerant: '',
    adresse: '',
    tel_gerant: '',
    actif: true,
    email: '',
    control_stock: false,
    annee_encours: new Date().getFullYear().toString(),
    logo: '/images/logo.png'
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Styles communs
  const inputTextStyle = "text-[#7e630c]";
  const titleTextStyle = "text-[#a1170e]";
  const inputContainerStyle = "relative";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e630c]"; // Mise à jour de la couleur de l'icône
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50 text-[#7e630c]";
  const menuItems: MenuItem[] = [
    { id: 'boulangerie', label: 'Boulangerie', icon: <Store size={20} /> },
    { id: 'sites', label: 'Sites', icon: <Building2 size={20} /> },
    { id: 'articles', label: 'Articles', icon: <Package size={20} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={20} /> },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: <Truck size={20} /> },
    { id: 'produits', label: 'Produits', icon: <Tag size={20} /> },
    { id: 'agents', label: 'Agents', icon: <UserCircle size={20} /> },
    { id: 'unites', label: 'Unités', icon: <Scale size={20} /> },
    { id: 'typesCuisson', label: 'Types de Cuisson', icon: <Cookie size={20} /> },
    { id: 'typesUnite', label: "Types d'Unité", icon: <Settings2 size={20} /> },
    { id: 'typesRecette', label: 'Types de Recette', icon: <Receipt size={20} /> },
    { id: 'typesProfil', label: 'Types de Profil', icon: <UserCircle size={20} /> },
    { id: 'typesDepense', label: 'Types de Dépense', icon: <DollarSign size={20} /> },
    { id: 'typesVente', label: 'Types de Vente', icon: <ShoppingCart size={20} /> },
    { id: 'typesClient', label: 'Types de Client', icon: <Users size={20} /> },
  ];

  // Effet pour charger les données initiales
  useEffect(() => {
    if (user) {
      console.log('🔄 Chargement des paramètres de la boulangerie...');
      setSettings(prev => ({
        ...prev,
        id_boul: user.bakeryId,
        nom_commercial: user.bakeryName,
        sigle: user.code_site	,
        nom_gerant: user.nom_gerant,
        adresse: user.adresse,
        tel_gerant: user.tel_site,
        actif: user.site_actif,
        email: '',
        control_stock: false,
        annee_encours: new Date().getFullYear().toString()
      }));

      if (user.sites) {
        setSites(user.sites.filter(site => site.actif).map(site => ({
          ...site,
          id_site: Number(site.id_site),
          id_boul: Number(site.id_boul)
        })));
      }

      setLoading(false);
    }
  }, [user]);

  // Fonction pour sauvegarder les types simples
  const handleSaveType = async (libelle: string, id_type: number = 0) => {
    // Liste des sections valides pour TypeVariable
    const validTypeVariableSections = [
      'unites',
      'typesCuisson',
      'typesUnite',
      'typesRecette',
      'typesProfil',
      'typesDepense',
      'typesVente',
      'typesClient'
    ] as const;
  
    type ValidTypeVariableSection = typeof validTypeVariableSections[number];
  
    // Vérification que la section active est valide pour TypeVariable
    if (!validTypeVariableSections.includes(activeSection as ValidTypeVariableSection)) {
      console.error('❌ Section invalide pour TypeVariable:', activeSection);
      return;
    }
    let nom_variable = '';
    switch (activeSection) {
      case 'unites':
        nom_variable = 'UNITE';
        break;
      case 'typesCuisson':
        nom_variable = 'CUISSON';
        break;
      case 'typesUnite':
        nom_variable = 'UNITE';
        break;
      case 'typesRecette':
        nom_variable = 'RECETTE';
        break;
      case 'typesProfil':
        nom_variable = 'AGENT';
        break;
      case 'typesDepense':
        nom_variable = 'DEPENSE';
        break;
      case 'typesVente':
        nom_variable = 'VENTE';
        break;
      case 'typesClient':
        nom_variable = 'CLIENT';
        break;
      default:
        console.error('❌ Section non valide:', activeSection);
        return;
    }
    try {
      console.log('🚀 Début de la sauvegarde du type', {
        section: nom_variable,
        libelle,
        id_type
      });
  
      
      const query = `
        SELECT * FROM public.save_parametres(
          ${user?.bakeryId}, 
          '${nom_variable}',
          '${libelle}',
          1,
          ${id_type},
          ${user?.id_site}
        )
      `;
  
      console.log('📤 Envoi de la requête:', query);
      const response = await envoyerRequeteApi('boulangerie', query);
  
      if (response && params) {
        console.log('✅ Réponse reçue:', response);
  
        const currentSection = activeSection as ValidTypeVariableSection;
        const currentParams = params[currentSection] || [];
  
        // Mise à jour ou ajout du type
        const updatedParams = id_type === 0
          ? [...currentParams, {
              id_type: response,
              libelle,
              nom_variable
            }]
          : currentParams.map((t) => {
              if ('id_type' in t) {
                return t.id_type === id_type ? { ...t, libelle } : t;
              }
              return t;
            });
  
        // Création du nouvel objet params
        const newParams: AppParams = {
          ...params,
          [currentSection]: updatedParams
        };
  
        console.log('📦 Paramètres mis à jour:', {
          section: currentSection,
          updatedParams
        });
  
        // Mise à jour des params avec le nouvel objet
        setParams(newParams);
  
        // Réinitialisation des états
        setIsModalOpen(false);
        setEditingType(null);
        setNewTypeLibelle('');
  
        console.log('🏁 Sauvegarde terminée avec succès');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors de la sauvegarde:', error.message);
      } else {
        console.error('❌ Erreur inattendue:', error);
      }
      throw error;
    }
  };
 
  const getTotalCount = () => {
    switch (activeSection) {
      case 'sites':
        return sites.length;
      case 'fournisseurs':
        return params?.fournisseurs?.length || 0;
      case 'articles':
        return params?.articles?.length || 0;
      case 'clients':
        return params?.clients?.length || 0;
      case 'produits':
        return params?.produits?.length || 0;
      case 'agents':
        return params?.agents?.length || 0;
      default:
        const types = params?.[activeSection as keyof typeof params] as TypeVariable[];
        return types?.length || 0;
    }
  };

  const handleAddNew = () => {
    switch (activeSection) {
      case 'sites':
        setEditingSite(null);
        break;
      case 'articles':
        setEditingArticle(null);
        break;
      case 'clients':
        setEditingClient(null);
        break;
      case 'produits':
        setEditingProduit(null);
        break;
      case 'fournisseurs':
        setEditingFournisseur(null);
        break;
      case 'agents':
        setEditingAgent(null);
        break;
      default:
        setEditingType(null);
        setNewTypeLibelle('');
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: DeletableItem) => {
    switch (activeSection) {
      case 'sites':
        setEditingSite(item as Site);
        break;
      case 'articles':
        setEditingArticle(item as Article);
        break;
      case 'clients':
        setEditingClient(item as Client);
        break;
      case 'produits':
        setEditingProduit(item as Produit);
        break;
      case 'fournisseurs':
        setEditingFournisseur(item as Fournisseur);
        break;
      case 'agents':
        setEditingAgent(item as Agent);
        break;
      default:
        if ('libelle' in item && 'nom_variable' in item) {
          setEditingType(item as TypeVariable);
          setNewTypeLibelle((item as TypeVariable).libelle);
        }
    }
    setIsModalOpen(true);
  };
  const handleDelete = (item: DeletableItem) => {
    console.log('🗑️ Suppression de:', item);
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !user?.bakeryId) {
      console.log('❌ Données manquantes:', { itemToDelete, bakeryId: user?.bakeryId });
      return;
    }
  
    try {
      console.log('🚀 Début de la suppression...', {
        activeSection,
        itemToDelete,
        bakeryId: user.bakeryId
      });
  
      // Helper function to determine if item is TypeVariable
      const isTypeVariable = (item: DeletableItem): item is TypeVariable => {
        return 'nom_variable' in item && 'libelle' in item;
      };

      // Détermination du type de paramètre et de l'ID
      const paramType = activeSection === 'sites' ? 'site' : 
                       activeSection === 'articles' ? 'article' : 
                       activeSection === 'clients' ? 'client' : 
                       activeSection === 'produits' ? 'produit' : 
                       activeSection === 'fournisseurs' ? 'fournisseur' : 
                       activeSection === 'agents' ? 'agent' : 
                       isTypeVariable(itemToDelete) ? itemToDelete.nom_variable :
                       activeSection;

      console.log('🔍 Type de paramètre déterminé:', paramType);
  
      const paramId = activeSection === 'clients' ? (itemToDelete as Client).id_client : 
                     activeSection === 'sites' ? (itemToDelete as Site).id_site :
                     activeSection === 'articles' ? (itemToDelete as Article).id_article :
                     activeSection === 'produits' ? (itemToDelete as Produit).id_produit :
                     activeSection === 'fournisseurs' ? (itemToDelete as Fournisseur).id_fournisseur :
                     activeSection === 'agents' ? (itemToDelete as Agent).id_agent :
                     (itemToDelete as TypeVariable).id_type;
  
      console.log('📊 Paramètres de suppression:', {
        paramType,
        paramId,
        siteId: user.id_site
      });
  
      const query = `SELECT * FROM delete_param(
        '${paramType}',
        ${user.bakeryId},
        ${paramId},
        ${activeSection === 'clients' ? user.id_site : 0}
      )`;
  
      console.log('📝 Requête de suppression:', query);
      
      const response = await envoyerRequeteApi('boulangerie', query);
  
      if (response === 'NOK') {
        console.error('❌ La suppression a échoué');
        throw new Error('La suppression a échoué');
      }
  
      console.log('✅ Suppression réussie');
      
      // Mise à jour du state local après suppression réussie
      handleSuccess();
  
      toast({
        title: "Succès",
        description: "Élément supprimé avec succès",
        variant: "success"
      });
  
    } catch (error) {
      console.error('🚨 Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Nettoyage final');
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

// Composant de dialogue de confirmation
const DeleteConfirmationDialog = () => {
  if (!isDeleteDialogOpen || !itemToDelete) return null;

  // Utiliser une fonction pour extraire le nom avec une assertion de type
  const getItemName = (item: DeletableItem): string => {
    if ('nom_site' in item) return item.nom_site as string;
    if ('nom_article' in item) return item.nom_article as string;
    if ('nom_client' in item) return item.nom_client as string;
    if ('nom_produit' in item) return item.nom_produit as string;
    if ('nom_fournisseur' in item) return item.nom_fournisseur as string;
    if ('nom_agent' in item) return item.nom_agent as string;
    if ('libelle' in item) return item.libelle as string;
    return 'Élément';
  };

  const itemName = getItemName(itemToDelete);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
        <p className="mb-6 text-gray-600">
          Êtes-vous sûr de vouloir supprimer &ldquo;{itemName}&rdquo; ? 
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setIsDeleteDialogOpen(false);
              setItemToDelete(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const handleSuccess = async () => {
  try {
    console.log('🔄 Rafraîchissement des données après opération...');
    
    if (!user?.bakeryId) {
      console.error('❌ ID boulangerie manquant');
      return;
    }

    // Pour les sites, on rafraîchit directement depuis les données user
    if (activeSection === 'sites' && user?.sites) {
      console.log('🏢 Rafraîchissement des sites');
      setSites(user.sites.filter(site => site.actif).map(site => ({
        ...site,
        id_site: Number(site.id_site),
        id_boul: Number(site.id_boul)
      })));
      return;
    }

    // Pour les autres sections, on met à jour les paramètres
    if (params) {
      const updatedParams = { ...params };
      
      // Mettre à jour le state en fonction de la section active
      switch (activeSection) {
        case 'articles':
          if (updatedParams.articles) {
            // Si itemToDelete est null, c'est une sauvegarde, pas une suppression
            if (itemToDelete) {
              updatedParams.articles = updatedParams.articles.filter(
                a => a.id_article !== (itemToDelete as Article).id_article
              );
            }
            
            // Rafraîchir la liste des articles depuis l'API
            try {
              const query = `
                SELECT a.*, tv.libelle as nom_type 
                FROM article a
                LEFT JOIN type_variable tv ON tv.id_type = a.id_type
                WHERE a.id_boul = ${user.bakeryId}
                ORDER BY a.nom_article
              `;
              console.log('📤 Requête de rafraîchissement articles:', query);
              
              const response = await envoyerRequeteApi('boulangerie', query);
              console.log('📥 Réponse du rafraîchissement articles:', response);
              
              if (Array.isArray(response)) {
                updatedParams.articles = response.map(article => ({
                  ...article,
                  id_article: Number(article.id_article),
                  id_type: Number(article.id_type),
                  id_site: Number(article.id_site),
                  pu_livreur: Number(article.pu_livreur),
                  pu_boutique: Number(article.pu_boutique),
                  pu_revente: Number(article.pu_revente),
                  nb_jour: Number(article.nb_jour)
                }));
                console.log('✨ Nouveaux articles chargés:', updatedParams.articles);
              } else {
                console.error('❌ La réponse n\'est pas un tableau:', response);
              }
            } catch (error) {
              console.error('❌ Erreur lors du rafraîchissement des articles:', error);
              throw error;
            }
          }
          break;

        case 'clients':
          if (updatedParams.clients) {
            // Si itemToDelete est null, c'est une sauvegarde, pas une suppression
            if (itemToDelete) {
              updatedParams.clients = updatedParams.clients.filter(
                c => c.id_client !== (itemToDelete as Client).id_client
              );
            }
            // Rafraîchir la liste des clients depuis l'API
            const query = `SELECT * FROM client WHERE id_site = ${user.id_site} ORDER BY nom_client`;
            const response = await envoyerRequeteApi('boulangerie', query);
            if (Array.isArray(response)) {
              updatedParams.clients = response;
            }
          }
          if (updatedParams.typesClient) {
            // Rafraîchir la liste des types de clients depuis l'API
            const query = `SELECT * FROM type_client WHERE id_site = ${user.id_site} ORDER BY libelle`;
            const response = await envoyerRequeteApi('boulangerie', query);
            if (Array.isArray(response)) {
              updatedParams.typesClient = response;
            }
          }
          break;
        case 'fournisseurs':
          if (updatedParams.fournisseurs) {
            console.log('🚛 Rafraîchissement des fournisseurs...');
            
            // Si itemToDelete est null, c'est une sauvegarde, pas une suppression
            if (itemToDelete) {
              updatedParams.fournisseurs = updatedParams.fournisseurs.filter(
                f => f.id_fournisseur !== (itemToDelete as Fournisseur).id_fournisseur
              );
            }
            
            // Rafraîchir la liste des fournisseurs depuis l'API
            try {
              const query = `
                SELECT * FROM fournisseur 
                WHERE id_boul = ${user.bakeryId}
                ORDER BY nom_fournisseur
              `;
              console.log('📤 Requête de rafraîchissement fournisseurs:', query);
              
              const response = await envoyerRequeteApi('boulangerie', query);
              console.log('📥 Réponse du rafraîchissement fournisseurs:', response);
              
              if (Array.isArray(response)) {
                updatedParams.fournisseurs = response.map(fournisseur => ({
                  ...fournisseur,
                  id_fournisseur: Number(fournisseur.id_fournisseur),
                  id_boul: Number(fournisseur.id_boul)
                }));
                console.log('✨ Nouveaux fournisseurs chargés:', updatedParams.fournisseurs);
              } else {
                console.error('❌ La réponse n\'est pas un tableau:', response);
              }
            } catch (error) {
              console.error('❌ Erreur lors du rafraîchissement des fournisseurs:', error);
              throw error;
            }
          }
          break;
        case 'produits':
          if (updatedParams.produits) {
            console.log('📦 Rafraîchissement des produits...');
            
            // Si itemToDelete est null, c'est une sauvegarde, pas une suppression
            if (itemToDelete) {
              updatedParams.produits = updatedParams.produits.filter(
                p => p.id_produit !== (itemToDelete as Produit).id_produit
              );
            }
            
            // Rafraîchir la liste des produits depuis l'API
            try {
              const query = `
                SELECT *
                FROM list_produits p 
                WHERE p.id_boul = ${user.bakeryId} 
                ORDER BY p.nom_produit
              `;
              console.log('📤 Requête de rafraîchissement produits:', query);
              
              const response = await envoyerRequeteApi('boulangerie', query);
              console.log('📥 Réponse du rafraîchissement produits:', response);
              
              if (Array.isArray(response)) {
                updatedParams.produits = response.map(produit => ({
                  ...produit,
                  id_produit: Number(produit.id_produit),
                  id_boul: Number(produit.id_boul),
                  id_type: Number(produit.id_type),
                  id_unite: Number(produit.id_unite),
                  actif: Boolean(produit.actif)
                }));
                console.log('✨ Nouveaux produits chargés:', updatedParams.produits.length, 'produits');
              } else {
                console.error('❌ La réponse n\'est pas un tableau:', response);
              }
            } catch (error) {
              console.error('❌ Erreur lors du rafraîchissement des produits:', error);
              throw error;
            }
          }
          break;
        case 'agents':
          if (updatedParams.agents) {
            console.log('📦 Rafraîchissement des agents...');
            console.log('📦 État initial des agents:', updatedParams.agents);
            
            // Si itemToDelete est null, c'est une sauvegarde, pas une suppression
            if (itemToDelete) {
              updatedParams.agents = updatedParams.agents.filter(
                a => a.id_agent !== (itemToDelete as Agent).id_agent
              );
            }
            
            // Rafraîchir la liste des agents depuis l'API
            try {
              const query = `
                SELECT *
                FROM list_agents
                WHERE id_boul = ${user.bakeryId} and agent_actif = true
                ORDER BY nom_agent
              `;
              
              console.log('📤 Requête de rafraîchissement agents:', query);
              console.log('📤 ID du site utilisé dans la requête:', user.id_site);
              
              const response = await envoyerRequeteApi('boulangerie', query);
              console.log('📥 Réponse brute du rafraîchissement agents:', JSON.stringify(response));
              
              if (Array.isArray(response)) {
                console.log('📥 Nombre d\'agents reçus:', response.length);
                
                if (response.length > 0) {
                  console.log('📥 Premier agent reçu:', JSON.stringify(response[0]));
                }
                
                updatedParams.agents = response.map(agent => {
                  // Ajouter plus de logs pour déboguer
                  console.log('📊 Données brutes de l\'agent:', agent);
                  
                  // Mapper les propriétés selon le format exact des données
                  const processedAgent = {
                    id_agent: Number(agent.id_agent),
                    nom_agent: agent.nom_agent || '',
                    id_type_agent: Number(agent.id_type_agent || 0),
                    id_site: Number(agent.id_site || 0),
                    id_profil: Number(agent.id_type_agent || 0), // id_profil correspond à id_type_agent
                    nom_site: agent.nom_site || '',
                    libelle_profil: agent.libelle_profil || '',
                    tel_agent: agent.tel_agent || '',
                    login_agent: agent.login_agent ,
                    agent_actif: agent.agent_actif 
                  };
                  console.log(`📥 Agent traité: ${processedAgent.nom_agent}`, processedAgent);
                  return processedAgent;
                });
                
                console.log('✨ Nouveaux agents chargés:', updatedParams.agents.length, 'agents');
                console.log('✨ Détail des agents après traitement:', JSON.stringify(updatedParams.agents));
              } else {
                console.error('❌ La réponse n\'est pas un tableau:', response);
              }
            } catch (error) {
              console.error('❌ Erreur lors du rafraîchissement des agents:', error);
              throw error;
            }
          } else {
            console.warn('⚠️ updatedParams.agents n\'est pas défini');
          }
          break;
        case 'unites':
        case 'typesCuisson':
        case 'typesUnite':
        case 'typesRecette':
        case 'typesProfil':
        case 'typesDepense':
        case 'typesVente':
        case 'typesClient':
          {
            const paramKey = activeSection as keyof Pick<AppParams, 'typesCuisson' | 'typesUnite' | 'typesRecette' | 'typesProfil' | 'typesDepense' | 'typesVente' | 'typesClient' | 'unites'>;
            const currentParams = updatedParams[paramKey];
            
            if (currentParams && Array.isArray(currentParams) && itemToDelete) {
              updatedParams[paramKey] = (currentParams as TypeVariable[]).filter(
                t => t.id_type !== (itemToDelete as TypeVariable).id_type
              );
            }
          }
          break;
      }

      // Mettre à jour le state avec les nouvelles données
      setParams(updatedParams);
      console.log('✅ Paramètres mis à jour localement');
    }

    toast({
      title: "Succès",
      description: "Les données ont été mises à jour",
      variant: "success"
    });

  } catch (error) {
    console.error('❌ Erreur lors du rafraîchissement:', error);
    toast({
      title: "Erreur",
      description: "Impossible de rafraîchir les données",
      variant: "destructive"
    });
  }
};

// Composant pour le filtre de sélection
const renderFilterSelect = (
  types: TypeVariable[],
  selectedType: number | 'all',
  onChange: (value: number | 'all') => void,
  label: string
) => {
  const inputContainerStyle = "relative";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500";
  const inputWithIconStyle = "pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputTextStyle = "text-gray-700";

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-blue-900 mb-2">
        Filtrer par {activeSection === 'produits' ? 'unité' : label}
      </label>
      <div className={inputContainerStyle}>
        <Filter size={20} className={inputIconStyle} />
        <select
          value={selectedType === 'all' ? 'all' : selectedType}
          onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className={`${inputWithIconStyle} ${inputTextStyle} cursor-pointer`}
        >
          <option value="all">
            {activeSection === 'produits' ? 'Toutes les unités' : 'Tous les types'}
          </option>
          {types.map((option) => (
            <option key={option.id_type} value={option.id_type}>
              {option.libelle}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Composant pour la recherche textuelle
const SearchInput = ({ onSearch, placeholder, value }: {
  onSearch: (value: string) => void;
  placeholder: string;
  value: string;
}) => {
  // Synchroniser l'état interne avec la valeur fournie par le parent
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  const [inputValue, setInputValue] = useState<string>(value);
  
  // Utilisation de useRef pour stocker la référence au timer de debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour appliquer le filtre avec debounce
  const applySearchWithDebounce = useCallback((value: string) => {
    // Annuler le timer précédent s'il existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Créer un nouveau timer
    debounceTimerRef.current = setTimeout(() => {
      onSearch(value);
    }, 300); // Délai de 300ms avant d'appliquer le filtre
  }, [onSearch]);

  // Nettoyage du timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    applySearchWithDebounce(value);
  };

  const handleReset = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-blue-900 mb-2">
        Recherche rapide
      </label>
      <div className="relative flex">
        <div className="relative flex-grow">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            placeholder={placeholder}
          />
        </div>
        <button
          onClick={handleReset}
          className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center"
          title="Initialiser la recherche"
        >
          <RefreshCw size={16} className="mr-1" />
          Initialiser
        </button>
      </div>
    </div>
  );
};

  const renderContent = () => {
    const commonCardStyle = "bg-white p-4 rounded-lg shadow-md relative group";
    const actionButtonsStyle = "absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity";
    
    switch (activeSection) {
      case 'boulangerie':
        return (
          <div className="space-y-6">
            {/* Logo */}
            <div>
              <label className={titleTextStyle + ' block text-sm font-medium text-gray-700 mb-2'}>
                Logo
              </label>
              <div className="flex items-center space-x-4">
                <Image
                  src={settings.logo}
                  alt="Logo de la boulangerie"
                  width={100}
                  height={100}
                  className="rounded-lg"
                />
                <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                  <Upload className="inline-block mr-2" size={20} />
                  Changer le logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Nom commercial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom commercial
              </label>
              <div className={inputContainerStyle}>
                <Store size={20} className={inputIconStyle} />
                <input
                  type="text"
                  value={settings.nom_commercial}
                  onChange={(e) => setSettings(prev => ({ ...prev, nom_commercial: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Nom commercial"
                />
              </div>
            </div>

            {/* Sigle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sigle
              </label>
              <div className={inputContainerStyle}>
                <Tag size={20} className={inputIconStyle} />
                <input
                  type="text"
                  value={settings.sigle}
                  onChange={(e) => setSettings(prev => ({ ...prev, sigle: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Sigle"
                />
              </div>
            </div>

            {/* Nom du gérant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du gérant
              </label>
              <div className={inputContainerStyle}>
                <User size={20} className={inputIconStyle} />
                <input
                  type="text"
                  value={settings.nom_gerant}
                  onChange={(e) => setSettings(prev => ({ ...prev, nom_gerant: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Nom du gérant"
                />
              </div>
            </div>

            {/* Téléphone du gérant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone du gérant
              </label>
              <div className={inputContainerStyle}>
                <Phone size={20} className={inputIconStyle} />
                <input
                  type="tel"
                  value={settings.tel_gerant}
                  onChange={(e) => setSettings(prev => ({ ...prev, tel_gerant: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Téléphone du gérant"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className={inputContainerStyle}>
                <AtSign size={20} className={inputIconStyle} />
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Email"
                />
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <div className={inputContainerStyle}>
                <MapPin size={20} className={`${inputIconStyle} top-3`} />
                <textarea
                  value={settings.adresse}
                  onChange={(e) => setSettings(prev => ({ ...prev, adresse: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Adresse"
                  rows={3}
                />
              </div>
            </div>

            {/* Année en cours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année en cours
              </label>
              <div className={inputContainerStyle}>
                <Calendar size={20} className={inputIconStyle} />
                <input
                  type="text"
                  value={settings.annee_encours}
                  onChange={(e) => setSettings(prev => ({ ...prev, annee_encours: e.target.value }))}
                  className={`${inputWithIconStyle} ${inputTextStyle}`}
                  placeholder="Année en cours"
                />
              </div>
            </div>

            {/* Contrôle des stocks */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.control_stock}
                  onChange={(e) => setSettings(prev => ({ ...prev, control_stock: e.target.checked }))}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
                <span className={`text-sm font-medium ${inputTextStyle}`}>
                  Activer le contrôle des stocks
                </span>
              </label>
            </div>

            {/* Statut actif */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.actif}
                  onChange={(e) => setSettings(prev => ({ ...prev, actif: e.target.checked }))}
                  className="form-checkbox h-5 w-5 text-blue-500"
                />
                <span className={`text-sm font-medium ${inputTextStyle}`}>
                  Boulangerie active
                </span>
              </label>
            </div>
          </div>
        );
      
      case 'sites':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <motion.div
                key={site.id_site}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={commonCardStyle}
              >
                <div className={actionButtonsStyle}>
                  <button
                    onClick={() => handleEdit(site)}
                    className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="Éditer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(site)}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className={`${titleTextStyle} font-semibold text-lg mb-2`}>
                  <Building2 size={20} className="inline-block mr-2" />
                  {site.nom_site}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Code: {site.code_site}</p>
                  <p>Gérant: {site.nom_gerant}</p>
                  <p>Tél: {site.tel}</p>
                  <p>Adresse: {site.adresse}</p>
                  <p className={`font-semibold ${site.actif ? 'text-green-600' : 'text-red-600'}`}>
                    {site.actif ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        );
      case 'fournisseurs':
        console.log('🔍 Rendu de la section fournisseurs');
        
        // Filtrer par texte de recherche
        const filteredFournisseurs = filterBySearchText(
          params?.fournisseurs,
          searchText,
          'nom_fournisseur'
        );
        
        console.log('🔍 Fournisseurs filtrés:', filteredFournisseurs.length);

        return (
          <>
            <SearchInput
              onSearch={(value) => handleSearchInputChange(value)}
              placeholder="Rechercher un fournisseur"
              value={searchInputValue}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFournisseurs.map((fournisseur) => (
                <motion.div
                  key={fournisseur.id_fournisseur}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={commonCardStyle}
                >
                  <div className={actionButtonsStyle}>
                    <button
                      onClick={() => handleEdit(fournisseur)}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Éditer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(fournisseur)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>  

                  <h3 className={`${titleTextStyle} font-semibold text-lg mb-2`}>
                    <Truck size={20} className="inline-block mr-2" />
                    {fournisseur.nom_fournisseur}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Téléphone: {fournisseur.tel_fournisseur}</p>
                    <p>Adresse: {fournisseur.adresse}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )
      case 'articles':
        console.log('🔍 Rendu de la section articles');
        
        // Filtrer par type
        const articlesFilteredByType = params?.articles?.filter(
          article => selectedArticleType === 'all' || Number(article.id_type) === Number(selectedArticleType)
        ) || [];
        
        // Filtrer par texte de recherche
        const filteredArticles = filterBySearchText(
          articlesFilteredByType,
          searchText,
          'nom_article'
        );
        
        console.log('🔍 Articles filtrés:', filteredArticles.length);

        return (
          <>
            {renderFilterSelect(
              params?.typesVente || [],
              selectedArticleType,
              setSelectedArticleType,
              "type d'article"
            )}
            <SearchInput
              onSearch={(value) => handleSearchInputChange(value)}
              placeholder="Rechercher un article"
              value={searchInputValue}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article: Article) => (
                <motion.div
                  key={article.id_article}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={commonCardStyle}
                >
                  <div className={actionButtonsStyle}>
                    <button
                      onClick={() => handleEdit(article)}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Éditer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(article)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className={`${titleTextStyle} font-semibold text-lg mb-2`}>
                    <Package size={20} className="inline-block mr-2" />
                    {article.nom_article}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Type: {article.nom_type}</p>
                    <p>Prix Livreur: {article.pu_livreur}</p>
                    <p>Prix Boutique: {article.pu_boutique}</p>
                    <p>Prix Revente: {article.pu_revente}</p>
                    <p>Jours: {article.nb_jour}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        );

      case 'clients':
        console.log('🔍 Rendu de la section clients');
        
        // Filtrer par type
        const clientsFilteredByType = params?.clients?.filter(
          client => selectedClientType === 'all' || Number(client.id_type) === Number(selectedClientType)
        ) || [];
        
        // Filtrer par texte de recherche
        const filteredClients = filterBySearchText(
          clientsFilteredByType,
          searchText,
          'nom_client'
        );
        
        console.log('🔍 Clients filtrés:', filteredClients.length);

        return (
          <>
            {renderFilterSelect(
              params?.typesClient || [],
              selectedClientType,
              setSelectedClientType,
              'type de client'
            )}
            <SearchInput
              onSearch={(value) => handleSearchInputChange(value)}
              placeholder="Rechercher un client"
              value={searchInputValue}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <motion.div
                  key={client.id_client}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={commonCardStyle}
                >
                  <div className={actionButtonsStyle}>
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Éditer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className={`${titleTextStyle} font-semibold text-lg mb-2`}>
                    <Users size={20} className="inline-block mr-2" />
                    {client.nom_client}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Type: {client.nom_type}</p>
                    <p>Tél: {client.tel_client}</p>
                    <p>Adresse: {client.adresse}</p>
                    <p className={`font-semibold ${client.actif ? 'text-green-600' : 'text-red-600'}`}>
                      {client.actif ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        );

      case 'agents':
        console.log('🔍 Rendu de la section agents');
        console.log('🔍 Profil de l\'utilisateur connecté:', user?.libelle_profil);
        
        // Filtrer les agents en fonction du profil de l'utilisateur
        const isManager = user?.libelle_profil === 'Manager';
        const currentUserSiteId = user?.id_site;
        
        // Si l'utilisateur n'est pas un Manager, on filtre les agents par id_site
        const agentsFilteredBySite = params?.agents?.filter(agent => {
          if (isManager) {
            return true; // Le Manager voit tous les agents
          } else {
            return agent.id_site === currentUserSiteId; // Les autres profils ne voient que les agents de leur site
          }
        }) || [];
        
        // Ensuite, on applique le filtre par profil
        const agentsFilteredByProfil = agentsFilteredBySite.filter(
          agent => {
            return selectedAgentProfil === 'all' || Number(agent.id_type_agent) === Number(selectedAgentProfil);
          }
        );
        
        // Enfin, on applique le filtre par texte de recherche
        const filteredAgents = filterBySearchText(
          agentsFilteredByProfil,
          searchText,
          'nom_agent'
        );
        
        console.log('🔍 Agents filtrés par site:', agentsFilteredBySite.length);
        console.log('🔍 Agents filtrés par profil:', agentsFilteredByProfil.length);
        console.log('🔍 Agents filtrés par recherche:', filteredAgents.length);

        return (
          <>
            {renderFilterSelect(
              params?.typesProfil || [],
              selectedAgentProfil,
              setSelectedAgentProfil,
              'profil'
            )}
            <SearchInput
              onSearch={(value) => handleSearchInputChange(value)}
              placeholder="Rechercher un agent"
              value={searchInputValue}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <motion.div
                  key={agent.id_agent}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={commonCardStyle}
                >
                  <div className={actionButtonsStyle}>
                    <button
                      onClick={() => handleEdit(agent)}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Éditer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(agent)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className={`${titleTextStyle} font-semibold text-lg mb-2`}>
                    <UserCircle size={20} className="inline-block mr-2" />
                    {agent.nom_agent || "Sans nom"}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Profil: <span className="font-medium">{agent.libelle_profil || "Non défini"}</span></p>
                    <p>Site: <span className="font-medium">{agent.nom_site || "Non défini"}</span></p>
                    <p>Tél: <span className="font-medium">{agent.tel_agent || 'Non renseigné'}</span></p>
                    <p>Login: <span className="font-medium">{agent.login_agent || 'Non renseigné'}</span></p>
                    <p className={`font-semibold ${agent.agent_actif ? 'text-green-600' : 'text-red-600'}`}>
                      {agent.agent_actif ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        );

      case 'produits': {  
        console.log('🔍 Rendu de la section produits');
        console.log('🔍 Produits disponibles dans params:', params?.produits);
        console.log('🔍 Type de params.produits:', params?.produits ? typeof params.produits : 'undefined');
        console.log('🔍 Est-ce que params.produits est un tableau?', Array.isArray(params?.produits));
        console.log('🔍 Longueur de params.produits:', params?.produits?.length || 0);
        
        let filteredProduits = params?.produits?.filter(produit => 
          selectedProduitUnite === 'all' || Number(produit.id_unite) === Number(selectedProduitUnite)
        );
        
        // Filtrer par texte de recherche
        filteredProduits = filterBySearchText(
          filteredProduits,
          searchText,
          'nom_produit'
        );
        
        console.log('🔍 Produits filtrés:', filteredProduits?.length);

        return (
          <div>
            {renderFilterSelect(
              params?.typesUnite || [],
              selectedProduitUnite,
              setSelectedProduitUnite,
              'unité'
            )}
            
            <SearchInput
              onSearch={(value) => handleSearchInputChange(value)}
              placeholder="Rechercher un produit"
              value={searchInputValue}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProduits.map((produit) => (
                <motion.div
                  key={produit.id_produit}
                  className={commonCardStyle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={actionButtonsStyle}>
                    <button
                      onClick={() => handleEdit(produit)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit size={16} className="text-blue-500" />
                    </button>
                  </div>
                  <h3 className="font-semibold mb-2 text-lg text-[#7e630c]">{produit.nom_produit}</h3>
                  <p className="text-sm text-gray-600">Unité: {produit.nom_unite}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );
      }

      // Rendu générique pour les types variables
      default:
        const types = params?.[activeSection as keyof typeof params] as TypeVariable[];
        if (!types) return null;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {types.map((type) => (
              <motion.div
                key={type.id_type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={commonCardStyle}
              >
                <div className={actionButtonsStyle}>
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="Éditer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(type)}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className={`${titleTextStyle} font-semibold text-lg mb-2`}>
                  {menuItems.find(item => item.id === activeSection)?.icon}
                  <span className="ml-2">{type.libelle}</span>
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Variable: {type.nom_variable}</p>
                </div>
              </motion.div>
            ))}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Fonction pour filtrer les éléments par texte de recherche
  const filterBySearchText = <T,>(
    items: T[] | undefined,
    searchText: string,
    nameField: keyof T
  ): T[] => {
    if (!items || !searchText.trim()) {
      return items || [];
    }
    
    const normalizedSearch = searchText.toLowerCase().trim();
    return items.filter(item => {
      const itemName = String(item[nameField] || '').toLowerCase();
      // Recherche si le texte est contenu dans le nom (pas seulement au début)
      return itemName.includes(normalizedSearch);
    });
  };

  const Modal = () => {
    if (!isModalOpen) return null;
  
    // Gestion des modaux spécifiques pour sites, articles, clients et 
    switch (activeSection) {
      case 'sites':
        return (
          <AddEditSite
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            site={editingSite || undefined}
            bakeryId={user?.bakeryId || 0}
            onSuccess={handleSuccess}
          />
        );
  
      case 'articles':
        return (
          <AddEditArticle
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            article={editingArticle || undefined}
            bakeryId={user?.bakeryId || 0}
            sites={sites}
            typesVente={params?.typesCuisson || []}
            onSuccess={handleSuccess}
          />
        );
        case 'fournisseurs':
          return (
            <AddEditFournisseur
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              fournisseur={editingFournisseur || undefined}
              bakeryId={user?.bakeryId || 0}
              onSuccess={handleSuccess}
            />
          );
      case 'clients':
        return (
          <AddEditClient
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            client={editingClient || undefined}
            sites={sites}
            typesClient={params?.typesClient || []}
            onSuccess={handleSuccess}
          />
        );
      
      case 'agents':
        return (
          <AddEditAgent
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            agent={editingAgent || undefined}
            sites={sites}
            typesProfil={params?.typesProfil || []}
            onSuccess={handleSuccess}
          />
        );
  
      case 'produits':
        // Convertir TypeVariable[] en Unite[]
        const unites = (params?.typesUnite || []).map(type => ({
          id_unite: type.id_type,
          nom_unite: type.libelle
        }));
        
        return (
          <AddEditProduit
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            produit={editingProduit || undefined}
            bakeryId={user?.bakeryId || 0}
            unites={unites}
            onSuccess={handleSuccess}
          />
        );
  
      // Modal générique pour les autres types de paramètres
      default:
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className={`${titleTextStyle} text-lg font-semibold mb-4`}>
                {editingType ? 'Modifier' : 'Ajouter'} {activeSection.toUpperCase()}
              </h3>
              
              <div className="mb-4">
              <Tag size={20} className={inputIconStyle} /> 
                <label className="block text-sm font-medium text-[#7e630c] mb-2">
                  Libellé
                </label>
                <input
                  type="text"
                  value={newTypeLibelle}
                  onChange={(e) => setNewTypeLibelle(e.target.value)}
                  className={inputWithIconStyle}
                  placeholder="Entrez le libellé"
                />
              </div>
  
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSaveType(newTypeLibelle, editingType?.id_type || 0)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!newTypeLibelle.trim()}
                >
                  {editingType ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Menu latéral */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
         <h2 className={`${titleTextStyle} text-xl font-semibold mb-4`}>Paramètres</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-red-50 text-red-600'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
                {activeSection === item.id && (
                  <ChevronRight className="ml-auto" size={16} />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
	   {/* Contenu principal */}
      <div className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`${titleTextStyle} text-2xl font-bold`}>
            {menuItems.find(item => item.id === activeSection)?.label} 
            <span className="text-gray-500 text-lg ml-2">
              (Effectif : {getTotalCount()})
            </span>
          </h1>
          <button
            onClick={handleAddNew}
            disabled={activeSection === 'boulangerie'}
            className={`
              flex items-center px-4 py-2 rounded-lg
              ${activeSection === 'boulangerie' 
                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                : 'bg-green-500 hover:bg-green-600 text-white'
              }
              transition-colors duration-200
            `}
          >
            <Plus size={20} className="mr-2" />
            Ajouter
          </button>
        </div>

        {renderContent()}
      </div>
	   {isModalOpen && (
          <Modal />
        )}
     <DeleteConfirmationDialog />
    </div>
  );
}
