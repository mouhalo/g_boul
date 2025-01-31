'use client';

import { useState, useEffect } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { Building2, MapPin, Phone, User } from 'lucide-react';

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

interface AddEditSiteProps {
  isOpen: boolean;
  onClose: () => void;
  site?: Site;
  bakeryId: number;
  onSuccess: () => void;
}

export default function AddEditSite({ isOpen, onClose, site, bakeryId, onSuccess }: AddEditSiteProps) {
  const [formData, setFormData] = useState<Partial<Site>>({
    code_site: '',
    nom_site: '',
    adresse: '',
    tel: '',
    nom_gerant: '',
    actif: true
  });

  useEffect(() => {
    if (site) {
      setFormData(site);
    }
  }, [site]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const query = `SELECT * FROM public.save_site(
        ${bakeryId},
        '${formData.code_site}',
        '${formData.nom_site}',
        '${formData.adresse}',
        '${formData.tel}',
        '${formData.nom_gerant}',
        ${formData.actif},
        ${site?.id_site || 0}
      )`;

      console.log('📤 Envoi de la requête save_site...');
      const response = await envoyerRequeteApi<'OK'>('boulangerie', query);

      if (response === 'OK') {
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

  const inputContainerStyle = "relative mb-4";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400";
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-[#a1170e]">
          {site ? 'Modifier' : 'Ajouter'} un site
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={inputContainerStyle}>
            <label className={labelStyle}>Code du site</label>
            <div className="relative">
              <Building2 size={20} className={inputIconStyle} />
              <input
                type="text"
                name="code_site"
                value={formData.code_site}
                onChange={handleInputChange}
                className={inputWithIconStyle}
                placeholder="Code du site"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nom du site</label>
            <div className="relative">
              <Building2 size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_site"
                value={formData.nom_site}
                onChange={handleInputChange}
                className={inputWithIconStyle}
                placeholder="Nom du site"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nom du gérant</label>
            <div className="relative">
              <User size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_gerant"
                value={formData.nom_gerant}
                onChange={handleInputChange}
                className={inputWithIconStyle}
                placeholder="Nom du gérant"
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
                name="tel"
                value={formData.tel}
                onChange={handleInputChange}
                className={inputWithIconStyle}
                placeholder="Numéro de téléphone"
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
                className={`${inputWithIconStyle} min-h-[80px] pt-2`}
                placeholder="Adresse du site"
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
              <span className="text-sm font-medium text-gray-700">Site actif</span>
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
              {site ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
