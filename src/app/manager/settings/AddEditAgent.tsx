'use client';

import { useState, useEffect } from 'react';
import { saveUser, UserUpdateData } from '@/app/services/userService';
import { Users, Building2, Phone, AtSign, UserCircle } from 'lucide-react';
import { useToast } from "@/components/ui/toast";

interface Agent {
  id_agent: number;
  nom_agent: string;
  id_type_agent: number;
  id_site: number;
  id_profil: number;
  libelle_profil: string;
  tel_agent?: string;
  login_agent?: string;
  actif?: boolean;
}

interface Site {
  id_site: number;
  nom_site: string;
}

interface TypeProfil {
  id_type: number;
  libelle: string;
}

interface AddEditAgentProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent;
  sites: Site[];
  typesProfil: TypeProfil[];
  onSuccess: () => void;
}

export default function AddEditAgent({
  isOpen,
  onClose,
  agent,
  sites,
  typesProfil,
  onSuccess
}: AddEditAgentProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<UserUpdateData>({
    id_site: sites[0]?.id_site || 0,
    type: typesProfil[0]?.id_type || 0,
    nom_agent: '',
    tel_agent: '',
    login_agent: '',
    actif: true
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        id_agent: agent.id_agent,
        id_site: agent.id_site,
        type: agent.id_type_agent,
        nom_agent: agent.nom_agent,
        tel_agent: agent.tel_agent || '',
        login_agent: agent.login_agent || '',
        actif: agent.actif !== undefined ? agent.actif : true
      });
    }
  }, [agent]);
  
  const inputTextStyle = "text-[#7e630c]";
  
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
      console.log('📤 Envoi des données agent...', formData);
      const response = await saveUser(formData);
      console.log('📦 Réponse save_agent:', response);

      if (response === 'OK') {
        console.log('✅ Agent sauvegardé avec succès');
        toast({
          title: "Succès",
          description: "L'agent a été sauvegardé avec succès",
          variant: "success"
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  const inputContainerStyle = "relative mb-4";
  const inputIconStyle = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400";
  const inputWithIconStyle = "pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-lime-50";
  const labelStyle = "block text-sm font-medium text-blue-900 mb-2";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-[#a1170e]">
          {agent ? 'Modifier' : 'Ajouter'} un agent
        </h3>

        <form onSubmit={handleSubmit}>
          <div className={inputContainerStyle}>
            <label className={labelStyle}>Nom de l&apos;agent</label>
            <div className="relative">
              <UserCircle size={20} className={inputIconStyle} />
              <input
                type="text"
                name="nom_agent"
                value={formData.nom_agent}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Nom de l&apos;agent"
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
                className={`${inputWithIconStyle} cursor-pointer ${inputTextStyle}`}
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
            <label className={labelStyle}>Profil</label>
            <div className="relative">
              <Users size={20} className={inputIconStyle} />
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`${inputWithIconStyle} cursor-pointer ${inputTextStyle}`}
                required
              >
                {typesProfil.map(type => (
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
                name="tel_agent"
                value={formData.tel_agent}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Numéro de téléphone"
                required
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>Login</label>
            <div className="relative">
              <AtSign size={20} className={inputIconStyle} />
              <input
                type="text"
                name="login_agent"
                value={formData.login_agent}
                onChange={handleInputChange}
                className={inputWithIconStyle + " " + inputTextStyle}
                placeholder="Login de l&apos;agent"
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
              <span className="text-sm font-medium text-gray-700">Agent actif</span>
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
              {agent ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
