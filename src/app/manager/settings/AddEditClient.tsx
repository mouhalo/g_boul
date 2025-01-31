'use client';

import { useState, useEffect } from 'react';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import { Users, Building2, Phone, MapPin } from 'lucide-react';

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

interface Site {
  id_site: number;
  nom_site: string;
}

interface TypeClient {
  id_type: number;
  libelle: string;
}

interface AddEditClientProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  bakeryId: number;
  sites: Site[];
  typesClient: TypeClient[];
  onSuccess: () => void;
}

export default function AddEditClient({
  isOpen,
  onClose,
  client,
  bakeryId,
  sites,
  typesClient,
  onSuccess
}: AddEditClientProps) {
  const [formData, setFormData] = useState<Partial<Client>>({
    nom_client: '',
    id_site: sites[0]?.id_site || 0,
    id_type: typesClient[0]?.id_type || 0,
    tel_client: '',
    adresse: '',
    actif: true
  });

  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

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
      const query = `SELECT * FROM public.save_client(
        ${bakeryId},
        ${formData.id_site},
        '${formData.nom_client}',
        ${formData.id_type},
        '${formData.tel_client}',
        '${formData.adresse}',
        ${formData.actif},
        ${client?.id_client || 0}
      )`;

      console.log('📤 Envoi de la requête save_client...');
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
          {client ? 'Modifier' : 'Ajouter'} un client
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nom du client</label>
            <div className="relative">
              <Users size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_client"
                value={formData.nom_client}
                onChange={handleInputChange}
                className={inputWithIconStyle}
                placeholder="Nom du client"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Site</label>
            <div className="relative">
              <Building2 size={20} className={inputIconStyle} />
              <select
                name="id_site"
                value={formData.id_site}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} cursor-pointer`}
                required
              >
                {sites.map(site => (
                  <option key={site.id_site} value={site.id_site}>
                    {site.nom_site}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Type de client</label>
            <div className="relative">
              <Users size={20} className={inputIconStyle} />
              <select
                name="id_type"
                value={formData.id_type}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} cursor-pointer`}
                required
              >
                {typesClient.map(type => (
                  <option key={type.id_type} value={type.id_type}>
                    {type.libelle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Téléphone</label>
            <div className="relative">
              <Phone size={20} className={inputIconStyle} />
              <input
                type="tel"
                name="tel_client"
                value={formData.tel_client}
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
                placeholder="Adresse du client"
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
              <span className="text-sm font-medium text-gray-700">Client actif</span>
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
              {client ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
