import React, { useState, useEffect } from 'react';
import { X, Key, ShieldAlert, Download, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApiStore } from '../../store/api';
import { useRepoStore } from '../../store/repo';
import { storage } from '../../utils/storage';
import { exportSessionToJson, importSessionFromJson, downloadFile } from '../../utils/export';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    githubToken,
    aiApiKey,
    aiProvider,
    setGithubToken,
    setAiApiKey,
    setAiProvider,
    wipeCredentials,
    initCredentials,
  } = useApiStore();

  const {
    loadAuditSession,
    metadata,
    secrets,
    vulnerabilities,
    dependencies,
    commits,
    architectureNodes,
    anomalies,
    securityScore,
    shannonThreshold,
  } = useRepoStore();

  const [localGhToken, setLocalGhToken] = useState(githubToken);
  const [localAiKey, setLocalAiKey] = useState(aiApiKey);
  const [savedNotification, setSavedNotification] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);

  // Directly fetch from local storage on modal open to populate inputs and notify unlocked status
  useEffect(() => {
    if (isOpen) {
      const storedGh = storage.getGitHubToken() || '';
      const storedAi = storage.getAiKey() || '';
      const storedProv = storage.getAiProvider() || 'gemini';

      setLocalGhToken(storedGh);
      setLocalAiKey(storedAi);
      setAiProvider(storedProv);
      setConfirmingWipe(false);
      setImportError(null);

      // Synchronize credentials to unlock features immediately across the app
      initCredentials();
    }
  }, [isOpen, initCredentials, setAiProvider]);

  if (!isOpen) return null;

  const isGhUnlocked = Boolean(localGhToken && localGhToken.trim().length >= 8);
  const isAiUnlocked = Boolean(localAiKey && localAiKey.trim().length >= 8);

  const handleSave = () => {
    setGithubToken(localGhToken);
    setAiApiKey(localAiKey);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleExecuteWipe = () => {
    wipeCredentials();
    setLocalGhToken('');
    setLocalAiKey('');
    setConfirmingWipe(false);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleExportJson = () => {
    const jsonStr = exportSessionToJson({
      metadata,
      secrets,
      vulnerabilities,
      dependencies,
      commits,
      architectureNodes,
      anomalies,
      securityScore,
      shannonThreshold,
    });
    const repoSlug = metadata?.name || 'forensic-session';
    downloadFile(`${repoSlug}-audit-session.json`, jsonStr, 'application/json');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const restored = importSessionFromJson(content);
        loadAuditSession(restored);
        setImportError(null);
        onClose();
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'Falha ao importar sessão');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
              Configurações & Credenciais Forenses
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedNotification && (
          <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            Preferências e credenciais sincronizadas com sucesso.
          </div>
        )}

        {importError && (
          <div className="mb-4 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-mono">
            <AlertTriangle className="w-4 h-4" />
            {importError}
          </div>
        )}

        {/* Local Storage Credential Status Overview */}
        <div className="mb-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500">Armazenamento Local:</span>
            <span
              data-testid="badge-gh-status"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                isGhUnlocked
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isGhUnlocked ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
              GitHub: {isGhUnlocked ? 'Desbloqueado' : 'Público'}
            </span>

            <span
              data-testid="badge-ai-status"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                isAiUnlocked
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAiUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              IA Nível 3: {isAiUnlocked ? 'Desbloqueado' : 'Bloqueado'}
            </span>
          </div>

          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            Zero Telemetria • 100% no Navegador
          </span>
        </div>

        <div className="space-y-4">
          {/* GitHub PAT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                GitHub Personal Access Token (PAT)
              </label>
              {isGhUnlocked && (
                <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Chave Carregada
                </span>
              )}
            </div>
            <input
              type="password"
              value={localGhToken}
              onChange={(e) => setLocalGhToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
            />
            {isGhUnlocked ? (
              <div
                data-testid="gh-unlocked-status"
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Desbloqueado no Armazenamento Local:</strong> Análise de repositórios privados e rate limit de 5.000 req/h liberados.
                </span>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-zinc-500">
                Necessário para escanear repositórios privados ou contornar o rate limit público de 60 requisições/hora.
              </p>
            )}
          </div>

          {/* AI LLM Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                Chave de API de IA (Nível 3)
              </label>
              <div className="flex items-center gap-2">
                {isAiUnlocked && (
                  <span className="text-[10px] font-mono text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Chave Carregada
                  </span>
                )}
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
            </div>
            <input
              type="password"
              value={localAiKey}
              onChange={(e) => setLocalAiKey(e.target.value)}
              placeholder="AIzaSy... ou sk-..."
              className="w-full rounded border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
            />
            {isAiUnlocked ? (
              <div
                data-testid="ai-unlocked-status"
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>Desbloqueado no Armazenamento Local:</strong> Síntese Forense via IA (Nível 3) e relatórios inteligentes liberados.
                </span>
              </div>
            ) : (
              <div
                data-testid="ai-locked-status"
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  <strong>Bloqueado:</strong> Guardrail estrito ativo. Insira sua chave de IA para desbloquear relatórios autônomos.
                </span>
              </div>
            )}
          </div>

          {/* Session Export & Import */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <span className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Persistência de Sessão Forense (JSON)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Exportar Sessão (.json)
              </button>

              <label className="flex items-center gap-1.5 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Importar Sessão (.json)
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4">
          {confirmingWipe ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExecuteWipe}
                className="flex items-center gap-1.5 rounded border border-red-600 bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 text-xs font-mono transition-colors shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                Confirmar Purga Imediata
              </button>
              <button
                type="button"
                onClick={() => setConfirmingWipe(false)}
                className="rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1.5 text-xs font-mono hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingWipe(true)}
              className="flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs font-mono text-red-500 dark:text-red-400 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Purgar Credenciais (Wipe)
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 text-xs font-mono font-medium shadow-xs"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
