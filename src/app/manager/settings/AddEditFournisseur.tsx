'use client';

import { useState, useEffect } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { Store, Phone, MapPin, Mail } from 'lucide-react';



interface Fournisseur {
  id_fournisseur: number;
  nom_fournisseur: string;
  id_boul: number;
  tel_fournisseur: string;
  adresse: string;
  email: string;
  actif: boolean;
}

interface SaveFournisseurResponse {
  save_fournisseur: string;
}

interface AddEditFournisseurProps {
  isOpen: boolean;
  onClose: () => void;
  fournisseur?: Fournisseur;
  bakeryId: number;
  onSuccess: () => void;
}

export default function AddEditFournisseur({
  isOpen,
  onClose,
  fournisseur,
  bakeryId,
  onSuccess
}: AddEditFournisseurProps) {
  const [formData, setFormData] = useState<Partial<Fournisseur>>({
    nom_fournisseur: '',
    id_boul: bakeryId,
    tel_fournisseur: '',
    adresse: '',
    email: '',
    actif: true
  });

  useEffect(() => {
    if (fournisseur) {
      setFormData(fournisseur);
    }
  }, [fournisseur]);

  const inputTextStyle = "text-[#7e630c]";
  const inputContainerStyle = "relative mb-4";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400";
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-2";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const query = `SELECT * FROM public.save_fournisseur(
        ${bakeryId},
        '${formData.nom_fournisseur}',
        '${formData.tel_fournisseur}',
        '${formData.adresse}',
        '${formData.email}',
        ${fournisseur?.id_fournisseur || 0}
      )`;

      console.log('📤 Envoi de la requête save_fournisseur...', query);
      const response = await envoyerRequeteApi<SaveFournisseurResponse[]>('boulangerie', query);
      console.log('📦 Réponse save_fournisseur:', response);

      if (response && response.length > 0 && response[0].save_fournisseur === 'OK') {
        console.log('✅ Fournisseur sauvegardé avec succès');
        onSuccess();
        onClose();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('❌ Erreur lors de la sauvegarde:', error.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-[#a1170e]">
          {fournisseur ? 'Modifier' : 'Ajouter'} un fournisseur
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nom du fournisseur</label>
            <div className="relative">
              <Store size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_fournisseur"
                value={formData.nom_fournisseur}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Nom du fournisseur"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Téléphone</label>
            <div className="relative">
              <Phone size={20} className={inputIconStyle} />
              <input
                type="tel"
                name="tel_fournisseur"
                value={formData.tel_fournisseur}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Numéro de téléphone"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Email</label>
            <div className="relative">
              <Mail size={20} className={inputIconStyle} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Adresse email"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Adresse</label>
            <div className="relative">
              <MapPin size={20} className={`${inputIconStyle} top-3`} />
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} min-h-[80px] pt-2 ${inputTextStyle}`}
                placeholder="Adresse du fournisseur"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="actif"
                checked={formData.actif}
                onChange={handleInputChange}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Fournisseur actif</span>
            </label>
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
            >
              {fournisseur ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}