import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useParameters } from '@/hooks/useParameters';
import { Parameter, ParameterType } from '@/types/parameters';
import { UserContext } from '@/app/contexts/UserContext';

interface EditParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: Parameter;
  parameterType: ParameterType;
  title: string;
}

const EditParameterModal: React.FC<EditParameterModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  parameterType,
  title
}) => {
  const { user } = useContext(UserContext);
  const {
    saveParameter,
    validateParameter,
    config
  } = useParameters(parameterType);

  const [formData, setFormData] = useState<Parameter>({
    id_type: '',
    libelle: '',
    nom_variable: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        id_type: editingItem.id_type,
        libelle: editingItem.libelle || '',
        nom_variable: editingItem.nom_variable || parameterType.toUpperCase()
      });
    } else {
      setFormData({
        id_type: '',
        libelle: '',
        nom_variable: parameterType.toUpperCase()
      });
    }
  }, [editingItem, parameterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const validation = validateParameter(formData);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid parameter');
        return;
      }

      await saveParameter(formData, user?.bakeryId?.toString() || '');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="bg-white p-6 rounded-lg w-full max-w-md" role="dialog" aria-labelledby="modal-title">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">{title}</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 text-gray-400 hover:text-gray-600 cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {config?.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="libelle" className="block text-sm font-medium text-gray-700 mb-1">
              Libellé
            </label>
            <Input
              id="libelle"
              type="text"
              value={formData.libelle}
              onChange={handleChange}
              name="libelle"
              className="w-full"
              required
              disabled={isSubmitting}
              aria-invalid={!!error}
            />
          </div>

          <div>
            <label htmlFor="nom_variable" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de variable
            </label>
            <Input
              id="nom_variable"
              type="text"
              value={formData.nom_variable}
              onChange={(e) => handleChange(e)}
              name="nom_variable"
              className="w-full"
              required
              disabled={isSubmitting}
              aria-invalid={!!error}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Enregistrement...' : editingItem ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditParameterModal;