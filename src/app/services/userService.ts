// src/app/services/userService.ts
import { envoyerRequeteApi } from '../apis/api';

interface SaveAgentResponse {
  save_agent: string;
}

export interface UserUpdateData {
  id_agent?: number;
  id_site: number;
  type: number;
  nom_agent: string;
  tel_agent: string;
  login_agent: string;
  actif: boolean;
}

export const saveUser = async (userData: UserUpdateData): Promise<string> => {
  const query = `
    SELECT * FROM public.save_agent(
      ${userData.id_site},
      ${userData.type},
      '${userData.nom_agent}',
      '${userData.tel_agent}',
      '${userData.login_agent}',
      ${userData.actif},
      ${userData.id_agent || 0}
    );
  `;

  try {
    const response = await envoyerRequeteApi('boulangerie', query) as SaveAgentResponse[];
    if (response && response[0]?.save_agent === 'OK') {
      return 'OK';
    }
    throw new Error('Échec de la mise à jour');
  } catch (error) {
    throw error;
  }
};
