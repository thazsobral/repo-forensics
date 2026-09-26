import { create } from 'zustand';
import { storage } from '../utils/storage';

interface ApiStoreState {
  githubToken: string;
  aiApiKey: string;
  aiProvider: string;
  isAiReady: boolean;
  isGitHubAuthenticated: boolean;
  rateLimit: {
    remaining: number;
    limit: number;
    reset: string;
  } | null;

  setGithubToken: (token: string) => void;
  setAiApiKey: (key: string) => void;
  setAiProvider: (provider: string) => void;
  setRateLimit: (rateLimit: { remaining: number; limit: number; reset: string }) => void;
  wipeCredentials: () => void;
  initCredentials: () => void;
}

export const useApiStore = create<ApiStoreState>((set) => ({
  githubToken: '',
  aiApiKey: '',
  aiProvider: 'gemini',
  isAiReady: false,
  isGitHubAuthenticated: false,
  rateLimit: null,

  setGithubToken: (token: string) => {
    storage.saveGitHubToken(token);
    set({
      githubToken: token,
      isGitHubAuthenticated: Boolean(token && token.trim().length >= 8),
    });
  },

  setAiApiKey: (key: string) => {
    storage.saveAiKey(key);
    set({
      aiApiKey: key,
      isAiReady: Boolean(key && key.trim().length >= 8),
    });
  },

  setAiProvider: (provider: string) => {
    storage.saveAiProvider(provider);
    set({ aiProvider: provider });
  },

  setRateLimit: (rateLimit) => {
    set({ rateLimit });
  },

  wipeCredentials: () => {
    storage.wipeAllCredentials();
    set({
      githubToken: '',
      aiApiKey: '',
      isAiReady: false,
      isGitHubAuthenticated: false,
      rateLimit: null,
    });
  },

  initCredentials: () => {
    const ghToken = storage.getGitHubToken() || '';
    const aiKey = storage.getAiKey() || '';
    const provider = storage.getAiProvider();

    set({
      githubToken: ghToken,
      aiApiKey: aiKey,
      aiProvider: provider,
      isGitHubAuthenticated: Boolean(ghToken && ghToken.trim().length >= 8),
      isAiReady: Boolean(aiKey && aiKey.trim().length >= 8),
    });
  },
}));
