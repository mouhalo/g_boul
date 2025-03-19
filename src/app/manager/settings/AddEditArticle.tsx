'use client';

import { useState, useEffect } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { Package, Tag, DollarSign, Calendar } from 'lucide-react';


interface Site {
  id_site: number;
  nom_site: string;
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

interface TypeVente {
  id_type: number;
  libelle: string;
}

interface AddEditArticleProps {
  isOpen: boolean;
  onClose: () => void;
  article?: Article;
  bakeryId: number;
  sites: Site[];
  typesVente: TypeVente[];
  onSuccess: () => void;
}

export default function AddEditArticle({ 
  isOpen, 
  onClose, 
  article, 
  bakeryId, 
  sites,
  typesVente,
  onSuccess 
}: AddEditArticleProps) {
  const [formData, setFormData] = useState<Partial<Article>>({
    nom_article: '',
    id_type: typesVente[0]?.id_type || 0,
    pu_livreur: 0,
    pu_boutique: 0,
    pu_revente: 0,
    nb_jour: 1,
    id_site: sites[0]?.id_site || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputTextStyle = "text-[#7e630c]";
  useEffect(() => {
    if (article) {
      setFormData(article);
    }
  }, [article]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Interface pour la réponse de l'API
  interface SaveArticleResponse {
    save_article: string;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const query = `SELECT * FROM public.save_article(
        ${bakeryId},
        ${formData.id_type},
        '${formData.nom_article}',        
        ${formData.pu_boutique || 0},
        ${formData.pu_revente || 0},
        ${formData.pu_livreur || 0},
        ${article?.id_article || 0},
        ${formData.nb_jour || 1},
        ${formData.id_site || sites[0]?.id_site || 0}
      )`;

      console.log(' Envoi de la requête save_article...', query);
      const response = await envoyerRequeteApi<SaveArticleResponse[]>('boulangerie', query);
      console.log(' Réponse save_article:', response);

      if (response && response.length > 0 && response[0].save_article === 'OK') {
        console.log(' Article sauvegardé avec succès');
        onSuccess();
        onClose();
      } else {
        console.error(' Erreur lors de la sauvegarde de l\'article:', response);
        throw new Error('La sauvegarde de l\'article a échoué');
      }
    } catch (error) {
      console.error(' Erreur lors de la sauvegarde:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de la sauvegarde de l\'article');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputContainerStyle = "relative mb-4";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400";
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-[#a1170e]">
          {article ? 'Modifier' : 'Ajouter'} un article
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nom de article</label>
            <div className="relative">
              <Package size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_article"
                value={formData.nom_article}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Nom de l'article"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle + " " + inputTextStyle} >Type article</label>
            <div className="relative">
              <Tag size={20} className={inputIconStyle} />
              <select
                name="id_type"
                value={formData.id_type}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} ${inputTextStyle} cursor-pointer`}
                required
              >
                {typesVente.map(type => (
                  <option key={type.id_type} value={type.id_type}>
                    {type.libelle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Prix livreur</label>
            <div className="relative">
              <DollarSign size={20} className={inputIconStyle} />
              <input
                type="number"
                name="pu_livreur"
                value={formData.pu_livreur}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Prix boutique</label>
            <div className="relative">
              <DollarSign size={20} className={inputIconStyle} />
              <input
                type="number"
                name="pu_boutique"
                value={formData.pu_boutique}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Prix revente</label>
            <div className="relative">
              <DollarSign size={20} className={inputIconStyle} />
              <input
                type="number"
                name="pu_revente"
                value={formData.pu_revente}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nombre de jours</label>
            <div className="relative">
              <Calendar size={20} className={inputIconStyle} />
              <input
                type="number"
                name="nb_jour"
                value={formData.nb_jour}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {article ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
          {error && (
            <div className="text-red-500 mt-2">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
