'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Scale } from 'lucide-react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';


interface Produit {
  id_produit: number;
  nom_produit: string;
  id_unite: number;
  nom_unite: string;
}

interface Unite {
  id_unite: number;
  nom_unite: string;
}

interface SaveProduitResponse {
  save_produit: string;
}

interface AddEditProduitProps {
  isOpen: boolean;
  onClose: () => void;
  produit?: Produit;
  unites: Unite[];
  bakeryId: number;
  onSuccess: () => void;
}

export default function AddEditProduit({
  isOpen,
  onClose,
  produit,
  bakeryId, 
  unites,
  onSuccess
}: AddEditProduitProps) {
  const [formData, setFormData] = useState<Omit<Produit, 'nom_unite'>>({
    id_produit: 0,
    nom_produit: '',
    id_unite: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Styles
  const inputTextStyle = "text-[#7e630c]";
  const labelStyle = "block text-sm font-medium mb-2";
  const inputContainerStyle = "mb-4 relative";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7e630c]";
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50";

  useEffect(() => {
    if (produit) {
      setFormData({
        id_produit: produit.id_produit,
        nom_produit: produit.nom_produit,
        id_unite: produit.id_unite
      });
    }
  }, [produit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const query = `SELECT * FROM public.save_produit(
        ${bakeryId},
        '${formData.nom_produit}',
        ${formData.id_unite},
        ${produit?.id_produit || 0}
      )`;

      console.log('📤 Envoi de la requête save_produit...', query);
      const response = await envoyerRequeteApi<SaveProduitResponse[]>('boulangerie', query);
      console.log('📦 Réponse save_produit:', response);

      if (response && response.length > 0 && response[0].save_produit === 'OK') {
        console.log('✅ Produit sauvegardé avec succès');
        onSuccess();
        onClose();
      } else {
        console.error('❌ Erreur lors de la sauvegarde du produit:', response);
        throw new Error('La sauvegarde du produit a échoué');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Une erreur est survenue lors de la sauvegarde du produit');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold mb-4 text-[#a1170e]">
          {produit ? 'Modifier' : 'Ajouter'} un produit
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={inputContainerStyle}>
            <label className={`${labelStyle} ${inputTextStyle}`}>Nom du produit</label>
            <div className="relative">
              <Tag size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_produit"
                value={formData.nom_produit}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} ${inputTextStyle}`}
                placeholder="Nom du produit"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={`${labelStyle} ${inputTextStyle}`}>Unité de mesure</label>
            <div className="relative">
              <Scale size={20} className={inputIconStyle} />
              <select
                name="id_unite"
                value={formData.id_unite}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} ${inputTextStyle} cursor-pointer`}
                required
              >
                <option value="">Sélectionner une unité</option>
                {unites.map(unite => (
                  <option key={unite.id_unite} value={unite.id_unite}>
                    {unite.nom_unite}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
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
              {produit ? 'Modifier' : 'Ajouter'}
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
