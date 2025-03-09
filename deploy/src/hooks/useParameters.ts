import { useEffect, useCallback } from 'react';
import useParameterStore from '@/store/parameterStore';
import { envoyerRequeteApi, ApiError } from '@/app/apis/api';
import {
  Parameter,
  Site,
  Article,
  Client,
  ParameterType,
  PARAMETER_CONFIGS
} from '@/types/parameters';


export const useParameters = (parameterType?: ParameterType) => {
  const store = useParameterStore();

  const validateParameter = (parameter: Parameter): { isValid: boolean; error?: string } => {
    if (!parameterType) {
      return { isValid: false, error: 'Parameter type not specified' };
    }

    const config = PARAMETER_CONFIGS[parameterType];
    if (!config) {
      return { isValid: false, error: 'Invalid parameter type' };
    }

    if (!parameter.libelle) {
      return { isValid: false, error: 'Le libellé est requis' };
    }

    return { isValid: true };
  };

  const saveParameter = async (parameter: Parameter, id_boul: string): Promise<void> => {
    try {
      store.setLoading(true);
      const validation = validateParameter(parameter);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const query = `SELECT * FROM public.save_parametres(${id_boul}, ${parameter.nom_variable}, ${parameter.libelle}, 1, ${parameter.id_type})`;
      console.log(' Envoi de la requête save_parametres...');
      const response = await envoyerRequeteApi('boulangerie', query);

      if (!response) {
        throw new Error('Failed to save parameter');
      }

      await fetchParameters();
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const saveSite = async (site: Site): Promise<void> => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.save_site(${site.id_boul}, '${site.code_site}', '${site.nom_site}', '${site.nom_gerant}', '${site.adresse}', '${site.tel}', ${site.id_site || 0})`;
      console.log(' Envoi de la requête save_site...');
      const response = await envoyerRequeteApi<string>('boulangerie', query);

      if (response !== 'OK') {
        throw new Error('Failed to save site');
      }

      await fetchSites();
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const saveClient = async (client: Client): Promise<void> => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.save_client(${client.id_site}, '${client.nom_client}', '${client.tel_client}', '${client.adresse}', ${client.id_type || 30}, ${client.id_client || 0})`;
      console.log(' Envoi de la requête save_client...');
      const response = await envoyerRequeteApi<string>('boulangerie', query);

      if (response !== 'OK') {
        throw new Error('Failed to save client');
      }

      await fetchClients();
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const saveArticle = async (article: Article): Promise<void> => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.save_article(${article.id_boul}, ${article.id_type}, '${article.nom_article}', ${article.prix_boutique}, ${article.prix_rvte}, ${article.prix_livreur}, ${article.id_article || 0}, ${article.nb_jour || 1}, ${article.id_site || 3})`;
      console.log(' Envoi de la requête save_article...');
      const response = await envoyerRequeteApi<string>('boulangerie', query);

      if (response !== 'OK') {
        throw new Error('Failed to save article');
      }

      await fetchArticles();
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
      throw error;
    } finally {
      store.setLoading(false);
    }
  };

  const fetchParameters = useCallback(async () => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.get_parameters()`;
      const response = await envoyerRequeteApi<Parameter[]>('boulangerie', query);
      
      if (response) {
        store.setParameters(response);
      } else {
        store.setError('Failed to fetch parameters');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchSites = useCallback(async () => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.get_sites()`;
      const response = await envoyerRequeteApi<Site[]>('boulangerie', query);
      
      if (response) {
        store.setSites(response);
      } else {
        store.setError('Failed to fetch sites');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchArticles = useCallback(async () => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.get_articles()`;
      const response = await envoyerRequeteApi<Article[]>('boulangerie', query);
      
      if (response) {
        store.setArticles(response);
      } else {
        store.setError('Failed to fetch articles');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchClients = useCallback(async () => {
    try {
      store.setLoading(true);
      const query = `SELECT * FROM public.get_clients()`;
      const response = await envoyerRequeteApi<Client[]>('boulangerie', query);
      
      if (response) {
        store.setClients(response);
      } else {
        store.setError('Failed to fetch clients');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        store.setError(error.message);
      } else if (error instanceof Error) {
        store.setError(error.message);
      } else {
        store.setError('An unknown error occurred');
      }
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchParameters(),
          fetchSites(),
          fetchArticles(),
          fetchClients()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [fetchParameters, fetchSites, fetchArticles, fetchClients]);

  return {
    parameters: store.parameters,
    sites: store.sites,
    articles: store.articles,
    clients: store.clients,
    loading: store.loading,
    error: store.error,
    fetchParameters,
    fetchSites,
    fetchArticles,
    fetchClients,
    saveParameter,
    saveSite,
    saveClient,
    saveArticle,
    validateParameter,
    config: parameterType ? PARAMETER_CONFIGS[parameterType] : undefined
  };
};
