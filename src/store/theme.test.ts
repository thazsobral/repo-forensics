import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useThemeStore } from './theme';

describe('useThemeStore and DOM dark-mode integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds .dark class to document.documentElement when setting theme to dark', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(localStorage.getItem('repo_forensics_theme')).toBe('dark');
  });

  it('removes .dark class from document.documentElement when setting theme to light', () => {
    document.documentElement.classList.add('dark');
    useThemeStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(localStorage.getItem('repo_forensics_theme')).toBe('light');
  });

  it('handles system preference resolution and updates DOM accordingly', () => {
    // Mock matchMedia returning false (light)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    useThemeStore.getState().setTheme('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(useThemeStore.getState().resolvedTheme).toBe('light');

    // Mock matchMedia returning true (dark)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    useThemeStore.getState().setTheme('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('initializes from saved localStorage state correctly', () => {
    localStorage.setItem('repo_forensics_theme', 'light');
    useThemeStore.getState().initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(useThemeStore.getState().theme).toBe('light');

    localStorage.setItem('repo_forensics_theme', 'dark');
    useThemeStore.getState().initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
