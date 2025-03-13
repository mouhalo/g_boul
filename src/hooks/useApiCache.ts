import { useState, useCallback } from 'react';
import { envoyerRequeteApi } from '@/app/apis/api';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheState {
  [key: string]: CacheItem<unknown>;
}

const CACHE_DEFAULT_DURATION = 5 * 60 * 1000; // 5 minutes

export function useApiCache<T>(cacheKey: string, expiresIn: number = CACHE_DEFAULT_DURATION) {
  const [cache, setCache] = useState<CacheState>({});

  const fetchData = useCallback(async (query: string): Promise<T | null> => {
    const cacheKeyWithQuery = `${cacheKey}-${query}`;
    const cachedItem = cache[cacheKeyWithQuery];

    if (cachedItem && Date.now() - cachedItem.timestamp < expiresIn) {
      return cachedItem.data as T;
    }

    try {
      const response = await envoyerRequeteApi('boulangerie', query);
      
      if (!response) {
        throw new Error('No data received');
      }

      const newCacheItem: CacheItem<T> = {
        data: response as T,
        timestamp: Date.now(),
      };

      setCache(prevCache => ({
        ...prevCache,
        [cacheKeyWithQuery]: newCacheItem,
      }));

      return response as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error fetching data:', error);
      return null;
    }
  }, [cache, cacheKey, expiresIn]);

  const invalidateCache = useCallback(() => {
    setCache(prevCache => {
      const newCache = { ...prevCache };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(cacheKey)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, [cacheKey]);

  return { fetchData, invalidateCache };
}
