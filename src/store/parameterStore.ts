import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Parameter,

  Site,
  Article,
  Client
} from '@/types/parameters';

interface ParameterStore {
  parameters: Parameter[];
  sites: Site[];
  articles: Article[];
  clients: Client[];
  loading: boolean;
  error: string | null;
  setParameters: (parameters: Parameter[]) => void;
  addParameter: (parameter: Parameter) => void;
  updateParameter: (id: string, parameter: Parameter) => void;
  deleteParameter: (id: string) => void;
  setSites: (sites: Site[]) => void;
  setArticles: (articles: Article[]) => void;
  setClients: (clients: Client[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useParameterStore = create<ParameterStore>()(
  devtools(
    immer((set) => ({
      parameters: [],
      sites: [],
      articles: [],
      clients: [],
      loading: false,
      error: null,

      setParameters: (parameters) =>
        set((state) => {
          state.parameters = parameters;
        }),

      addParameter: (parameter) =>
        set((state) => {
          state.parameters.push(parameter);
        }),

      updateParameter: (id, parameter) =>
        set((state) => {
          const index = state.parameters.findIndex((p) => p.id_type === id);
          if (index !== -1) {
            state.parameters[index] = parameter;
          }
        }),

      deleteParameter: (id) =>
        set((state) => {
          state.parameters = state.parameters.filter((p) => p.id_type !== id);
        }),

      setSites: (sites) =>
        set((state) => {
          state.sites = sites;
        }),

      setArticles: (articles) =>
        set((state) => {
          state.articles = articles;
        }),

      setClients: (clients) =>
        set((state) => {
          state.clients = clients;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),
    }))
  )
);

export default useParameterStore;
