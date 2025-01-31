declare module '@/apis/api' {
  export class ApiError extends Error {
    constructor(message: string);
  }

  interface UserResponse {
    role: 'admin' | 'gerant' | 'caissiere' | 'client';
    login: string;
    code_boulangerie: string;
    // Add other known fields with specific types
    message?: string;
    status?: number;
  }

  export function envoyerRequeteApi(
    pAppName: string, 
    pRequete: string | { requete: string; parametres?: (string | number)[] }, 
    additionalParam?: string
  ): Promise<UserResponse[]>;
}
