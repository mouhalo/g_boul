const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://154.12.224.173:8080'
  : 'http://154.12.224.173:8080';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SqlRequest {
  requete: string;
  parametres?: (string | number)[];
}

interface ApiResponse<T = unknown> {
  datas?: T;
}

// 👇 Types de retour attendus
type ApiReturnType = 'array' | 'number' | 'boolean' | 'object' | 'void';

function construireRequeteSql(
  pSQL_Request: string | SqlRequest,
  additionalParam = ''
): string {
  const sqlQuery =
    typeof pSQL_Request === 'object' ? pSQL_Request.requete : pSQL_Request;

  let finalQuery = sqlQuery;
  if (typeof pSQL_Request === 'object' && pSQL_Request.parametres) {
    pSQL_Request.parametres.forEach((param, index) => {
      const paramValue = typeof param === 'string' ? `'${param}'` : param;
      finalQuery = finalQuery.replace(`$${index + 1}`, paramValue.toString());
    });
  }

  return finalQuery + additionalParam;
}

function construireXml(pAppName: string, requeteSql: string): string {
  if (!requeteSql) throw new ApiError('Requête SQL invalide');

  const sql_text = requeteSql.toString().replace(/\n/g, ' ').trim();
  return `<?xml version="1.0" encoding="UTF-8"?>
    <requete>
      <application>${pAppName}</application>
      <requete_sql>${sql_text}</requete_sql>
      <mode/>
      <json_contenu/>
      <table_name/>
      <id_name/>
      <condition/>
    </requete>`;
}

// 👇 Gestion de fallback en fonction du type attendu
function getFallbackValue<T>(expected: ApiReturnType): T {
  switch (expected) {
    case 'array':
      return [] as T;
    case 'number':
      return 0 as T;
    case 'boolean':
      return false as T;
    case 'object':
      return null as T;
    case 'void':
      return undefined as T;
    default:
      return null as T;
  }
}

// 💥 La version robuste et future-proof
export async function envoyerRequeteApi<T>(
  pAppName: string,
  pRequete: string | SqlRequest,
  additionalParam = '',
  expectedReturnType: ApiReturnType = 'array'
): Promise<T> {
  try {
    const sqlQuery = construireRequeteSql(pRequete, additionalParam);
    const xml = construireXml(pAppName, sqlQuery);

    const response = await fetch(`${API_BASE_URL}/api/execute_requete_from_xml/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json'
      },
      body: xml,
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      const errorText = await response.text();

      // 🔥 Gestion des 404 -> fallback value
      if (response.status === 404) {
        console.warn(`🟡 Données non trouvées. Fallback -> ${expectedReturnType}`);
        return getFallbackValue<T>(expectedReturnType);
      }

      throw new ApiError(`Erreur réseau: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as ApiResponse<T>;
    return data?.datas ?? getFallbackValue<T>(expectedReturnType);

  } catch (error) {
    console.error('🚨 Erreur API:', error instanceof Error ? error.message : 'Unknown error');

    // Ne rethrow plus. On retourne un fallback safe.
    return getFallbackValue<T>(expectedReturnType);
  }
}
