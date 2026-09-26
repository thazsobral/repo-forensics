import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Boxes,
  GitCommit,
  Network,
  ExternalLink,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { filterSecretsByEntropy } from '../../utils/entropy';

export const DashboardView: React.FC = () => {
  const {
    metadata,
    secrets,
    vulnerabilities,
    dependencies,
    commits,
    architectureNodes,
    anomalies,
    securityScore,
    shannonThreshold,
    isDemoLab,
    setActiveView,
  } = useRepoStore();

  const activeSecrets = filterSecretsByEntropy(secrets, shannonThreshold);
  const criticalSecrets = activeSecrets.filter((s) => s.severity === 'critical');
  const vulnerableDeps = dependencies.filter((d) => d.vulnerabilities.length > 0);
  const suspiciousCommits = commits.filter((c) => c.isAfterHours || c.isPotentialSpoof);
  const criticalNodes = architectureNodes.filter((n) => n.riskLevel === 'critical');

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-red-500 border-red-500/40 bg-red-500/10';
    if (score < 75) return 'text-amber-500 border-amber-500/40 bg-amber-500/10';
    return 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10';
  };

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Top Banner / Mode indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold font-mono tracking-tight">
              {metadata?.fullName || 'Nenhum repositório analisado'}
            </h1>
            {isDemoLab && (
              <span className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-semibold">
                LABORATÓRIO SIMULADO
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Auditado em {metadata?.analyzedAt ? new Date(metadata.analyzedAt).toLocaleString() : 'N/A'} • Branch: {metadata?.defaultBranch || 'main'} • Arquivos indexados: {metadata?.totalFiles || 0}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {metadata && (
            <a
              href={`https://github.com/${metadata.fullName}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-mono text-cyan-500 hover:underline"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Main Forensic Score & Critical Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Security Posture Score Card */}
        <div className="md:col-span-2 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
              Score de Postura Forense
            </span>
            <Cpu className="w-4 h-4 text-zinc-400" />
          </div>

          <div className="my-3 flex items-baseline gap-3">
            <div
              data-testid="posture-score-value"
              className={`text-4xl font-mono font-extrabold px-3 py-1 rounded border ${getScoreColor(
                securityScore
              )}`}
            >
              {securityScore}
              <span className="text-sm font-normal text-zinc-400">/100</span>
            </div>
            <div>
              <span className="text-xs font-mono font-bold block">
                {securityScore < 40
                  ? 'CRÍTICO: Risco Imediato'
                  : securityScore < 75
                  ? 'ALERTA: Vulnerabilidades Ativas'
                  : 'ESTÁVEL: Postura Aceitável'}
              </span>
              <span className="text-[11px] text-zinc-500">
                Calculado com base em segredos expostos, CVEs e anomalias de Git.
              </span>
            </div>
          </div>

          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                securityScore < 40 ? 'bg-red-500' : securityScore < 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(5, securityScore)}%` }}
            />
          </div>
        </div>

        {/* 4 Micro Metric Cards */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Card 1: Hardcoded Secrets */}
          <div
            onClick={() => setActiveView('secrets')}
            className="cursor-pointer rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3 hover:border-red-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase">Segredos</span>
              <KeyRound className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-mono font-bold text-red-500">
                {activeSecrets.length}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate">
                {criticalSecrets.length} críticos
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-500 flex items-center gap-0.5">
              Auditar <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Card 2: Supply Chain */}
          <div
            onClick={() => setActiveView('supply-chain')}
            className="cursor-pointer rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3 hover:border-orange-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase">Supply Chain</span>
              <Boxes className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-mono font-bold text-orange-400">
                {vulnerableDeps.length}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate">
                {vulnerabilities.length} CVEs
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-500 flex items-center gap-0.5">
              Inspecionar <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Card 3: Commit Timeline */}
          <div
            onClick={() => setActiveView('timeline')}
            className="cursor-pointer rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3 hover:border-amber-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase">Git Timeline</span>
              <GitCommit className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-mono font-bold text-amber-400">
                {suspiciousCommits.length}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate">
                suspeitos
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-500 flex items-center gap-0.5">
              Linha do Tempo <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Card 4: Architecture */}
          <div
            onClick={() => setActiveView('architecture')}
            className="cursor-pointer rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-3 hover:border-cyan-500/50 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-mono uppercase">Superfície</span>
              <Network className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="my-1">
              <span className="text-2xl font-mono font-bold text-zinc-200">
                {architectureNodes.length}
              </span>
              <span className="text-[10px] text-red-400 block truncate">
                {criticalNodes.length} expostos
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-500 flex items-center gap-0.5">
              Mapear <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Anomaly Breakdown Radar / Metric Bars */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Vectores de Anomalia & Análise Heurística
        </h2>
        <div className="space-y-3">
          {anomalies.map((a, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">{a.category}</span>
                <span className="text-zinc-500">
                  {a.label} ({a.findingCount} ocorrências) —{' '}
                  <strong
                    className={
                      a.score > 70
                        ? 'text-red-400'
                        : a.score > 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {a.score}%
                  </strong>
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    a.score > 70 ? 'bg-red-500' : a.score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${a.score}%` }}
                />
              </div>
            </div>
          ))}
          {anomalies.length === 0 && (
            <div className="text-center py-6 text-xs font-mono text-zinc-500">
              Nenhuma anomalia calculada para este repositório.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
