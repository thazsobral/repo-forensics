import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  RefreshCw,
} from 'lucide-react';
import { useThemeStore } from '../../store/theme';
import { useRepoStore } from '../../store/repo';
import { useApiStore } from '../../store/api';
import { fetchGitHubRepo, parseRepoSlug } from '../../utils/github';
import { SettingsModal } from '../../features/settings/SettingsModal';
import { ThemeMode } from '../../types/forensics';

export const Header: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    repoInput,
    setRepoInput,
    isDemoLab,
    toggleDemoLab,
    isAnalyzing,
    setIsAnalyzing,
    setForensicState,
    setError,
  } = useRepoStore();

  const {
    isAiReady,
    isGitHubAuthenticated,
    rateLimit,
    githubToken,
    setRateLimit,
  } = useApiStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    const parsed = parseRepoSlug(repoInput);
    if (!parsed) {
      setError('Formato inválido. Use "owner/repo" ou URL completa "https://github.com/owner/repo"');
      return;
    }

    // If currently in Demo Lab, disable it before analyzing real repository
    if (isDemoLab) {
      toggleDemoLab(false);
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await fetchGitHubRepo(
        parsed.owner,
        parsed.repo,
        githubToken,
        (info) => setRateLimit(info)
      );
      setForensicState(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na análise do repositório';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Claro', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Escuro', icon: <Moon className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'Sistema', icon: <Laptop className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-3 text-zinc-900 dark:text-zinc-100">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-500">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm tracking-tight flex items-center gap-1.5">
              repo-forensics
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-semibold tracking-wider">
                beta
              </span>
            </span>
          </div>
        </div>

        {/* Repository Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl mx-2 flex items-center"
        >
          <div className="relative w-full flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="Escanear repositório: owner/repo ou https://github.com/..."
              className="w-full rounded-l border border-r-0 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="rounded-r border border-cyan-600 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Analisando...</span>
                </>
              ) : (
                <span>Analisar</span>
              )}
            </button>
          </div>
        </form>

        {/* Status Badges, Demo Lab, Theme & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* GitHub Status Badge */}
          <div
            title={
              isGitHubAuthenticated
                ? 'GitHub Token Autenticado'
                : rateLimit
                ? `Rate Limit Restante: ${rateLimit.remaining}/${rateLimit.limit} (Reseta: ${rateLimit.reset})`
                : 'Acesso Anônimo (Rate Limit 60 req/h)'
            }
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-[11px] font-mono"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isGitHubAuthenticated ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
            />
            <span className="text-zinc-500">GH:</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              {isGitHubAuthenticated
                ? 'PAT Ativo'
                : rateLimit
                ? `${rateLimit.remaining} req`
                : 'Público'}
            </span>
          </div>

          {/* AI Status Badge */}
          <div
            title={
              isAiReady
                ? 'Chave de IA configurada para relatórios Nível 3'
                : 'Chave de IA ausente (Necessária para Nível 3)'
            }
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-[11px] font-mono"
          >
            {isAiReady ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <AlertCircle className="w-3 h-3 text-amber-500" />
            )}
            <span className="text-zinc-500">IA:</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              {isAiReady ? 'Pronta' : 'Sem Chave'}
            </span>
          </div>

          {/* Demo Lab Toggle Button */}
          <button
            type="button"
            onClick={() => toggleDemoLab()}
            title={isDemoLab ? 'Desativar Demo Lab e purgar cache' : 'Ativar Demo Lab simulado'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-medium transition-all ${
              isDemoLab
                ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-400 shadow-xs shadow-cyan-500/10'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FlaskConical className={`w-3.5 h-3.5 ${isDemoLab ? 'text-cyan-400 animate-pulse' : ''}`} />
            <span>Demo Lab</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                isDemoLab
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {isDemoLab ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Triple Theme Selector */}
          <div className="flex items-center rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5">
            {themeOptions.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => setTheme(opt.mode)}
                title={`Tema: ${opt.label}`}
                className={`p-1 rounded text-xs transition-colors ${
                  theme === opt.mode
                    ? 'bg-white dark:bg-zinc-800 text-cyan-500 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                {opt.icon}
              </button>
            ))}
          </div>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Abrir Configurações e Chaves"
            className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
