'use client';

import { useState, useEffect } from 'react';
import useLogin from '@/app/hooks/useLogin';
import { AppParams } from '@/app/contexts/ParamsContext';
import { motion } from 'framer-motion';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import Image from 'next/image';
import AddEditSite from './AddEditSite';
import AddEditArticle from './AddEditArticle';
import AddEditClient from './AddEditClient';
import AddEditProduit from './AddEditProduit'; // Importer le composant AddEditProduit
import { 
  Upload, 
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
  Filter
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
  | 'produits'
  | 'unites'
  | 'typesCuisson'
  | 'typesUnite'
  | 'typesRecette'
  | 'typesProfil'
  | 'typesDepense'
  | 'typesVente'
  | 'typesClient';

interface MenuItem {
  id: MenuSection;
  label: string;
  icon: React.ReactNode;
}

type DeletableItem = TypeVariable | Site | Article | Client | Produit;

export default function SettingsPage() {
  const { user, params, setParams } = useLogin();

  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<MenuSection>('boulangerie');
  const [selectedArticleType, setSelectedArticleType] = useState<number | 'all'>('all');
  const [selectedClientType, setSelectedClientType] = useState<number | 'all'>('all');
  const [selectedProduitUnite, setSelectedProduitUnite] = useState<number | 'all'>('all');
  
  // États pour les modaux
  const [editingType, setEditingType] = useState<TypeVariable | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
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
    { id: 'produits', label: 'Produits', icon: <Tag size={20} /> },
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
        sigle: '',
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
      'les_unites',
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
          ${id_type}
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
                       isTypeVariable(itemToDelete) ? itemToDelete.nom_variable :
                       activeSection;

      console.log('🔍 Type de paramètre déterminé:', paramType);
  
      const paramId = activeSection === 'clients' ? (itemToDelete as Client).id_client : 
                     activeSection === 'sites' ? (itemToDelete as Site).id_site :
                     activeSection === 'articles' ? (itemToDelete as Article).id_article :
                     activeSection === 'produits' ? (itemToDelete as Produit).id_produit :
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
      console.log('📨 Réponse reçue:', response);
  
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

  const itemName = 'nom_site' in itemToDelete 
    ? itemToDelete.nom_site 
    : 'nom_article' in itemToDelete 
    ? itemToDelete.nom_article
    : 'nom_client' in itemToDelete
    ? itemToDelete.nom_client
    : 'nom_produit' in itemToDelete
    ? itemToDelete.nom_produit
    : itemToDelete.libelle;

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
    console.log('🔄 Rafraîchissement des données après suppression...');
    
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
            updatedParams.articles = updatedParams.articles.filter(
              a => a.id_article !== (itemToDelete as Article).id_article
            );
          }
          break;

        case 'clients':
          if (updatedParams.clients) {
            updatedParams.clients = updatedParams.clients.filter(
              c => c.id_client !== (itemToDelete as Client).id_client
            );
          }
          break;

        case 'produits':
          if (updatedParams.produits) {
            updatedParams.produits = updatedParams.produits.filter(
              p => p.id_produit !== (itemToDelete as Produit).id_produit
            );
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
            const paramKey = activeSection as keyof Pick<AppParams, 'typesCuisson' | 'typesUnite' | 'typesRecette' | 'typesProfil' | 'typesDepense' | 'typesVente' | 'typesClient' | 'les_unites'>;
            const currentParams = updatedParams[paramKey];
            
            if (currentParams && Array.isArray(currentParams)) {
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

  const renderFilterSelect = (
    types: TypeVariable[],
    selectedType: number | 'all',
    onChange: (value: number | 'all') => void,
    label: string
  ) => {
    // Déterminer les options à afficher en fonction de la section active
    const getFilterOptions = () => {
      if (activeSection === 'produits' && params?.typesUnite) {
        return params.typesUnite.map(unite => ({
          id: unite.id_type,
          libelle: unite.libelle
        }));
      }
      if (activeSection === 'articles' && params?.typesCuisson) {
        return params.typesCuisson.map(unite => ({
          id: unite.id_type,
          libelle: unite.libelle
        }));
      }
      return types.map(type => ({
        id: type.id_type,
        libelle: type.libelle
      }));
    };
  

  const filterOptions = getFilterOptions();

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
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
          {filterOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.libelle}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
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
            typesVente={params?.typesCuisson || []}
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
      
      case 'articles':
        const filteredArticles = params?.articles?.filter(
          (article: Article) => selectedArticleType === 'all' || article.id_type === selectedArticleType
        ) || [];
        
        return (
          <>
            {renderFilterSelect(
              params?.typesVente || [],
              selectedArticleType,
              setSelectedArticleType,
              "type d'article"
            )}
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
        const filteredClients = params?.clients?.filter(
          client => selectedClientType === 'all' || client.id_type === selectedClientType
        ) || [];

        return (
          <>
            {renderFilterSelect(
              params?.typesClient || [],
              selectedClientType,
              setSelectedClientType,
              'type de client'
            )}
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

      case 'produits': {
        const produits = params?.produits || [];
        const filteredProduits = selectedProduitUnite === 'all'
          ? produits
          : produits.filter(p => p.id_unite === selectedProduitUnite);

        return (
          <div>
            {renderFilterSelect(
              params?.les_unites || [],
              selectedProduitUnite,
              (value) => setSelectedProduitUnite(value),
              'unité'
            )}
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
          </h1>
          <button
            onClick={handleAddNew}
            className="fixed bottom-8 right-8 z-10 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
            title="Ajouter"
          >
            <Plus size={24} />
          </button>
        </div>

        {renderContent()}
      </div>
	   {isModalOpen && <Modal />}
     <DeleteConfirmationDialog />
    </div>
  );
}
