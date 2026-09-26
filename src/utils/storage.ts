export const STORAGE_KEYS = {
  GITHUB_TOKEN: 'repo_forensics_gh_token',
  AI_API_KEY: 'repo_forensics_ai_key',
  AI_PROVIDER: 'repo_forensics_ai_provider',
  SESSION_CACHE: 'repo_forensics_session_cache',
  SHANNON_THRESHOLD: 'repo_forensics_shannon_threshold',
  SIDEBAR_COLLAPSED: 'repo_forensics_sidebar_collapsed',
} as const;

export const storage = {
  saveGitHubToken: (token: string): void => {
    if (!token || token.trim() === '') {
      localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
    } else {
      localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token.trim());
    }
  },

  getGitHubToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
    } catch {
      return null;
    }
  },

  saveAiKey: (key: string): void => {
    if (!key || key.trim() === '') {
      localStorage.removeItem(STORAGE_KEYS.AI_API_KEY);
    } else {
      localStorage.setItem(STORAGE_KEYS.AI_API_KEY, key.trim());
    }
  },

  getAiKey: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AI_API_KEY);
    } catch {
      return null;
    }
  },

  saveAiProvider: (provider: string): void => {
    localStorage.setItem(STORAGE_KEYS.AI_PROVIDER, provider);
  },

  getAiProvider: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AI_PROVIDER) || 'gemini';
    } catch {
      return 'gemini';
    }
  },

  hasValidAiKey: (): boolean => {
    const key = storage.getAiKey();
    return Boolean(key && key.trim().length >= 8);
  },

  hasGitHubToken: (): boolean => {
    const token = storage.getGitHubToken();
    return Boolean(token && token.trim().length >= 8);
  },

  wipeAllCredentials: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AI_API_KEY);
      localStorage.removeItem(STORAGE_KEYS.AI_PROVIDER);
      localStorage.removeItem(STORAGE_KEYS.SESSION_CACHE);
    } catch {
      // Safely ignore storage access issues
    }
  },

  saveSidebarState: (collapsed: boolean): void => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(collapsed));
  },

  getSidebarState: (): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }
};
