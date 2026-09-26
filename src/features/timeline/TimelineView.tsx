import React, { useState, useMemo } from 'react';
import {
  GitCommit,
  Clock,
  UserX,
  AlertTriangle,
  FileCode,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { getGitHubCommitUrl, getGitHubFileUrl } from '../../utils/github';
import { Badge } from '../../components/common/Badge';

export const TimelineView: React.FC = () => {
  const { commits, metadata } = useRepoStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState<
    'all' | 'anomalous' | 'after-hours' | 'spoof' | 'keywords' | 'clean'
  >('all');
  const [sortBy, setSortBy] = useState<
    'date-desc' | 'date-asc' | 'risk-desc' | 'churn-desc' | 'files-desc'
  >('date-desc');

  const suspiciousCount = commits.filter(
    (c) => c.isAfterHours || c.isPotentialSpoof || c.suspiciousKeywordsDetected.length > 0
  ).length;

  const filteredAndSortedCommits = useMemo(() => {
    const result = commits.filter((c) => {
      // Anomaly type filter
      if (anomalyFilter === 'anomalous') {
        if (!c.isAfterHours && !c.isPotentialSpoof && c.suspiciousKeywordsDetected.length === 0) {
          return false;
        }
      } else if (anomalyFilter === 'after-hours') {
        if (!c.isAfterHours) return false;
      } else if (anomalyFilter === 'spoof') {
        if (!c.isPotentialSpoof) return false;
      } else if (anomalyFilter === 'keywords') {
        if (c.suspiciousKeywordsDetected.length === 0) return false;
      } else if (anomalyFilter === 'clean') {
        if (c.isAfterHours || c.isPotentialSpoof || c.suspiciousKeywordsDetected.length > 0) {
          return false;
        }
      }

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = c.message.toLowerCase().includes(q);
        const matchesAuthor = c.author.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesSha = c.sha.toLowerCase().includes(q) || c.shortSha.toLowerCase().includes(q);
        const matchesKeyword = c.suspiciousKeywordsDetected.some((k) => k.toLowerCase().includes(q));
        if (!matchesMsg && !matchesAuthor && !matchesEmail && !matchesSha && !matchesKeyword) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'risk-desc') {
        const getRiskScore = (item: typeof a) => {
          let s = 0;
          if (item.isPotentialSpoof) s += 4;
          if (item.isAfterHours) s += 2;
          s += item.suspiciousKeywordsDetected.length;
          return s;
        };
        const diff = getRiskScore(b) - getRiskScore(a);
        if (diff !== 0) return diff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'churn-desc') {
        return b.additions + b.deletions - (a.additions + a.deletions);
      }
      if (sortBy === 'files-desc') {
        return b.changedFilesCount - a.changedFilesCount;
      }
      return 0;
    });
  }, [commits, anomalyFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-amber-500" />
            Linha do Tempo Forense & Anomalias de Commits
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Detecção de commits fora de expediente, spoofing de identidade e padrões anômalos de injeção.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Commits Anômalos:</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
            {suspiciousCount} de {commits.length}
          </span>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 space-y-3">
        {/* Search input & Sort Selector */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por mensagem, autor, e-mail, hash sha..."
              className="w-full rounded border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-mono text-zinc-500">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
            >
              <option value="date-desc">Data (Mais Recentes)</option>
              <option value="date-asc">Data (Mais Antigos)</option>
              <option value="risk-desc">Nível de Risco (Anômalos Primeiro)</option>
              <option value="churn-desc">Volume de Código (Churn +/-)</option>
              <option value="files-desc">Arquivos Alterados</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
          <span className="text-zinc-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-zinc-400" /> Filtros:
          </span>

          <button
            type="button"
            onClick={() => setAnomalyFilter('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              anomalyFilter === 'all'
                ? 'bg-zinc-800 text-cyan-400 font-bold border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Todos ({commits.length})
          </button>

          <button
            type="button"
            onClick={() => setAnomalyFilter('anomalous')}
            className={`px-2 py-0.5 rounded transition-colors ${
              anomalyFilter === 'anomalous'
                ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Anômalos ({suspiciousCount})
          </button>

          <button
            type="button"
            onClick={() => setAnomalyFilter('after-hours')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              anomalyFilter === 'after-hours'
                ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" />
            Fora de Expediente ({commits.filter((c) => c.isAfterHours).length})
          </button>

          <button
            type="button"
            onClick={() => setAnomalyFilter('spoof')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              anomalyFilter === 'spoof'
                ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <UserX className="w-3 h-3 text-red-500" />
            Spoofing ({commits.filter((c) => c.isPotentialSpoof).length})
          </button>

          <button
            type="button"
            onClick={() => setAnomalyFilter('keywords')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              anomalyFilter === 'keywords'
                ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Termos de Risco ({commits.filter((c) => c.suspiciousKeywordsDetected.length > 0).length})
          </button>

          <button
            type="button"
            onClick={() => setAnomalyFilter('clean')}
            className={`px-2 py-0.5 rounded transition-colors ${
              anomalyFilter === 'clean'
                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Limpos ({commits.filter((c) => !c.isAfterHours && !c.isPotentialSpoof && c.suspiciousKeywordsDetected.length === 0).length})
          </button>

          {(searchQuery || anomalyFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setAnomalyFilter('all');
              }}
              className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-200 underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Timeline items */}
      <div className="space-y-3">
        {filteredAndSortedCommits.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
            Nenhum commit encontrado para os filtros selecionados.
          </div>
        ) : (
          filteredAndSortedCommits.map((commit) => {
            const hasAnomalies =
              commit.isAfterHours ||
              commit.isPotentialSpoof ||
              commit.suspiciousKeywordsDetected.length > 0;

            const commitUrl = getGitHubCommitUrl(metadata?.fullName, commit.sha);
            const commitDate = new Date(commit.date);
            const hoursGmt = String(commitDate.getUTCHours()).padStart(2, '0');
            const minutesGmt = String(commitDate.getUTCMinutes()).padStart(2, '0');
            const timeGmt = `${hoursGmt}:${minutesGmt} GMT`;

            return (
              <div
                key={commit.sha}
                className={`rounded border p-3 font-mono text-xs transition-colors space-y-2 ${
                  hasAnomalies
                    ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Active clickable link to GitHub Commit */}
                    <a
                      href={commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors group"
                      title={`Investigar commit ${commit.sha} no GitHub`}
                    >
                      <span>{commit.shortSha}</span>
                      <ExternalLink className="w-3 h-3 text-cyan-500 group-hover:translate-x-0.5 transition-transform" />
                    </a>

                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {commit.author}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      &lt;{commit.email}&gt;
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">
                      {new Date(commit.date).toUTCString()}
                    </span>

                    <a
                      href={commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-cyan-400 transition-colors"
                      title="Abrir página completa do commit no GitHub"
                    >
                      <span>Ver no GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Commit Message */}
                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold pl-1 border-l-2 border-zinc-300 dark:border-zinc-700">
                  {commit.message}
                </p>

                {/* Anomaly Badges and File Links */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  {commit.isAfterHours && (
                    <span
                      data-testid="badge-after-hours"
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-mono text-[11px]"
                      title={`Commit realizado às ${timeGmt} (janela noturna/madrugada fora do expediente comercial)`}
                    >
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Fora de Expediente ({timeGmt})</span>
                    </span>
                  )}

                  {commit.isPotentialSpoof && (
                    <span
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 font-bold"
                      title={`Autor informado (${commit.author} <${commit.email}>) apresenta divergência ou e-mail externo não autenticado`}
                    >
                      <UserX className="w-3 h-3 text-red-500 shrink-0" />
                      <span>Alerta de Spoofing / E-mail Não Verificado</span>
                    </span>
                  )}

                  {commit.suspiciousKeywordsDetected.length > 0 && (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        Termos de Risco:
                      </span>
                      {commit.suspiciousKeywordsDetected.map((keyword) => {
                        const isFileTarget = keyword.includes('.') || keyword.includes('/');
                        return isFileTarget ? (
                          <a
                            key={keyword}
                            href={getGitHubFileUrl(metadata?.fullName, metadata?.defaultBranch, keyword)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-colors underline"
                            title={`Investigar arquivo ${keyword} no GitHub`}
                          >
                            <span>{keyword}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span
                            key={keyword}
                            className="px-1.5 py-0.2 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono"
                          >
                            {keyword}
                          </span>
                        );
                      })}
                    </span>
                  )}

                  <span className="text-zinc-500 ml-auto font-mono">
                    +{commit.additions} / -{commit.deletions} linhas em {commit.changedFilesCount} arquivos
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

