import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sliders,
  Filter,
  AlertOctagon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { filterSecretsByEntropy } from '../../utils/entropy';
import { copyToClipboard } from '../../utils/export';
import { getGitHubFileUrl } from '../../utils/github';
import { Badge } from '../../components/common/Badge';
import { Severity } from '../../types/forensics';

export const SecretsScannerView: React.FC = () => {
  const { secrets, shannonThreshold, setShannonThreshold, metadata } = useRepoStore();

  const [unmaskedItems, setUnmaskedItems] = useState<Record<string, boolean>>({});
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Apply Shannon entropy threshold filter
  const entropyFiltered = filterSecretsByEntropy(secrets, shannonThreshold);

  // Apply severity and text filters
  const displayedSecrets = entropyFiltered.filter((s) => {
    if (selectedSeverity !== 'all' && s.severity !== selectedSeverity) return false;
    if (categoryFilter.trim()) {
      const q = categoryFilter.toLowerCase();
      return (
        s.category.toLowerCase().includes(q) ||
        s.file.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleMask = (id: string) => {
    setUnmaskedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const getEntropyBadgeColor = (h: number) => {
    if (h >= 4.5) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (h >= 3.8) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
  };

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Title & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-red-500" />
            Auditor de Segredos & Entropia de Shannon
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Motor Regex com 32+ regras forenses associado a cálculo estocástico de incerteza da informação (H).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Exibindo:</span>
          <strong className="text-zinc-900 dark:text-zinc-100">
            {displayedSecrets.length} de {secrets.length} segredos
          </strong>
        </div>
      </div>

      {/* Shannon Entropy Threshold Slider Bar (Mandatory Requirement) */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-mono font-bold">
              Controle Deslizante de Shannon:
            </span>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
              Limiar H &ge; {shannonThreshold.toFixed(2)}
            </span>
          </div>

          <div className="text-[11px] font-mono text-zinc-500">
            Filtra apenas tokens com aleatoriedade estocástica acima da linha de corte
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500">0.0 (Tudo)</span>
          <input
            type="range"
            min="0"
            max="6.0"
            step="0.1"
            data-testid="shannon-slider"
            value={shannonThreshold}
            onChange={(e) => setShannonThreshold(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
          />
          <span className="text-[10px] font-mono text-zinc-500">6.0 (Extremo)</span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
          <span>0.0 - 2.0: Texto simples</span>
          <span>2.0 - 3.8: Padrões com repetição</span>
          <span className="text-amber-500">3.8 - 4.5: Chaves de API moderadas</span>
          <span className="text-red-500 font-bold">&gt; 4.5: Chaves Criptográficas e Hashes Puros</span>
        </div>
      </div>

      {/* Filter and Query controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-mono text-zinc-500">Severidade:</span>
          {(['all', 'critical', 'high', 'medium'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-0.5 rounded text-xs font-mono capitalize transition-colors ${
                selectedSeverity === sev
                  ? 'bg-zinc-800 text-cyan-400 font-bold border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {sev === 'all' ? 'Todas' : sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filtrar por categoria, arquivo..."
            className="rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Secrets Findings Table / List */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        {displayedSecrets.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500 space-y-1">
            <AlertOctagon className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <p>Nenhum segredo encontrado para o limiar de entropia atual ({shannonThreshold.toFixed(2)}).</p>
            <p className="text-[11px] text-zinc-600">
              Reduza o controle deslizante de Shannon para inspecionar tokens com menor aleatoriedade.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {displayedSecrets.map((secret) => {
              const isUnmasked = Boolean(unmaskedItems[secret.id]);
              const isCopied = copiedId === secret.id;

              return (
                <div
                  key={secret.id}
                  className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={secret.severity}>{secret.severity.toUpperCase()}</Badge>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {secret.category}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded border font-mono text-[10px] font-bold ${getEntropyBadgeColor(
                          secret.entropy
                        )}`}
                      >
                        H = {secret.entropy.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-zinc-500 text-[11px]">{secret.description}</p>

                    <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px] flex-wrap">
                      <span>Arquivo:</span>
                      <a
                        href={getGitHubFileUrl(metadata?.fullName, metadata?.defaultBranch, secret.file, secret.line)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded transition-all group"
                        title={`Investigar ${secret.file}:${secret.line} no GitHub`}
                      >
                        <span className="font-semibold">{secret.file}:{secret.line}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-500 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Right: Secret Value, Mask Toggle, Copy */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-mono bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded max-w-[280px] sm:max-w-xs truncate text-[11px]">
                      {isUnmasked ? (
                        <span className="text-red-400 select-all font-semibold">
                          {secret.matchedString}
                        </span>
                      ) : (
                        <span className="text-zinc-400 select-none">
                          {secret.maskedString}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMask(secret.id)}
                      title={isUnmasked ? 'Mascarar credencial' : 'Revelar credencial'}
                      className="p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"
                    >
                      {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(secret.id, secret.matchedString)}
                      title="Copiar credencial"
                      className="p-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-cyan-400"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
