import { create } from 'zustand';
import { ThemeMode } from '../types/forensics';

const THEME_STORAGE_KEY = 'repo_forensics_theme';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  initTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const applyToDOM = (resolved: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  resolvedTheme: 'dark',

  setTheme: (mode: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage unavailable or disabled
    }

    const resolved = mode === 'system' ? getSystemTheme() : mode;
    applyToDOM(resolved);

    set({ theme: mode, resolvedTheme: resolved });
  },

  initTheme: () => {
    let saved: ThemeMode = 'dark';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        saved = stored;
      }
    } catch {
      // Fallback
    }

    const resolved = saved === 'system' ? getSystemTheme() : saved;
    applyToDOM(resolved);
    set({ theme: saved, resolvedTheme: resolved });

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (get().theme === 'system') {
          const newResolved = e.matches ? 'dark' : 'light';
          applyToDOM(newResolved);
          set({ resolvedTheme: newResolved });
        }
      };
      // Modern and legacy support
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      }
    }
  },
}));
