'use client';


import { useState, useEffect } from 'react';
import useLogin from '@/app/hooks/useLogin';
import { motion } from 'framer-motion';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import Image from 'next/image';
import AddEditSite from './AddEditSite';
import AddEditArticle from './AddEditArticle';
import AddEditClient from './AddEditClient';;
import { 
  Upload, 
  Edit2, 
  Trash2, 
  Building2,

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

export default function SettingsPage() {
  const { user, params } = useLogin();
  const [activeSection, setActiveSection] = useState<MenuSection>('boulangerie');
  const [selectedArticleType, setSelectedArticleType] = useState<number | 'all'>('all');
  const [selectedClientType, setSelectedClientType] = useState<number | 'all'>('all');
  
  // États pour les modaux
  const [editingType, setEditingType] = useState<TypeVariable | null>(null);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newTypeLibelle, setNewTypeLibelle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400";
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50";

  const menuItems: MenuItem[] = [
    { id: 'boulangerie', label: 'Boulangerie', icon: <Store size={20} /> },
    { id: 'sites', label: 'Sites', icon: <Building2 size={20} /> },
    { id: 'articles', label: 'Articles', icon: <Package size={20} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={20} /> },
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
    try {
      // Ne traiter que les types simples
      if (['sites', 'articles', 'clients'].includes(activeSection)) {
        console.error('❌ Cette fonction ne doit pas être utilisée pour les types spéciaux');
        return;
      }

      const nom_variable = activeSection.toUpperCase();
      const query = `SELECT * FROM public.save_parametres(${user?.bakeryId}, '${nom_variable}', '${libelle}', 1, ${id_type})`;
      
      console.log('📤 Envoi de la requête save_parametres...');
      const response = await envoyerRequeteApi('boulangerie', query);
      
      if (response) {
        // Mettre à jour l'état local
        const updatedTypes = id_type === 0 
          ? [...(params?.[activeSection as keyof typeof params] || []), { 
              id_type: response, 
              libelle, 
              nom_variable 
            }]
          : (params?.[activeSection as keyof typeof params] || []).map(type => 
              type.id_type === id_type ? { ...type, libelle } : type
            );
        
        if (params) {
          const newParams = { ...params };
          newParams[activeSection as keyof typeof params] = updatedTypes;
          // Mettre à jour params ici
        }
        
        setIsModalOpen(false);
        setEditingType(null);
        setNewTypeLibelle('');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors de la sauvegarde:', error.message);
      }
    }
  };



  const Modal = () => {
    if (!isModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className={`${titleTextStyle} text-lg font-semibold mb-4`}>
            {editingType ? 'Modifier' : 'Ajouter'} un type
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
      default:
        setEditingType(null);
        setNewTypeLibelle('');
    }
    setIsModalOpen(true);
  };

  const handleEdit = (item: TypeVariable | Site | Article | Client) => {
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
      default:
        if ('libelle' in item && 'nom_variable' in item) {
          setEditingType(item as TypeVariable);
          setNewTypeLibelle((item as TypeVariable).libelle);
        }
    }
    setIsModalOpen(true);
  };

  const handleDelete = (item: TypeVariable | Site | Article | Client) => {
    console.log('🗑️ Supprimer dans la section:', activeSection, item);
  };

  const handleSuccess = () => {
    // Rafraîchir les données selon la section
    switch (activeSection) {
      case 'sites':
        if (user?.sites) {
          setSites(user.sites.filter(site => site.actif).map(site => ({
            ...site,
            id_site: Number(site.id_site),
            id_boul: Number(site.id_boul)
          })));
        }
        break;
      case 'articles':
      case 'clients':
        // Rafraîchir via params
        break;
      default:
        // Rafraîchir les types simples
        break;
    }
  };

  const renderModal = () => {
    if (!isModalOpen) return null;

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
            typesVente={params?.typesVente || []}
            onSuccess={handleSuccess}
          />
        );
      case 'clients':
        return (
          <AddEditClient
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            client={editingClient || undefined}
            bakeryId={user?.bakeryId || 0}
            sites={sites}
            typesClient={params?.typesClient || []}
            onSuccess={handleSuccess}
          />
        );
      default:
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className={`${titleTextStyle} text-lg font-semibold mb-4`}>
                {editingType ? 'Modifier' : 'Ajouter'} un type
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

  const renderFilterSelect = (
    types: TypeVariable[],
    selectedType: number | 'all',
    onChange: (value: number | 'all') => void,
    label: string
  ) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filtrer par {label}
      </label>
      <div className={inputContainerStyle}>
        <Filter size={20} className={inputIconStyle} />
        <select
          value={selectedType === 'all' ? 'all' : selectedType}
          onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className={`${inputWithIconStyle} ${inputTextStyle} cursor-pointer`}
        >
          <option value="all">Tous les types</option>
          {types.map((type) => (
            <option key={type.id_type} value={type.id_type}>
              {type.libelle}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

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
    </div>
  );
}
