import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileCode,
  GitCommit,
  Layers,
  KeyRound,
  Copy,
  Check,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { performMultilayerSearch } from '../../utils/search';
import { copyToClipboard } from '../../utils/export';
import { getGitHubFileUrl, getGitHubCommitUrl } from '../../utils/github';
import { Badge } from '../../components/common/Badge';

export const ForensicExplorerView: React.FC = () => {
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
  } = useRepoStore();

  const [query, setQuery] = useState('');
  const [searchFiles, setSearchFiles] = useState(true);
  const [searchContent, setSearchContent] = useState(true);
  const [searchCommits, setSearchCommits] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    return performMultilayerSearch(
      {
        query,
        searchFiles,
        searchContent,
        searchCommits,
      },
      {
        metadata,
        secrets,
        vulnerabilities,
        dependencies,
        commits,
        architectureNodes,
        anomalies,
        securityScore,
        shannonThreshold,
      }
    );
  }, [
    query,
    searchFiles,
    searchContent,
    searchCommits,
    metadata,
    secrets,
    vulnerabilities,
    dependencies,
    commits,
    architectureNodes,
    anomalies,
    securityScore,
    shannonThreshold,
  ]);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleAddOperator = (op: string) => {
    setQuery((prev) => `${prev.trim()} ${op} `.trimStart());
  };

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-500" />
            Explorador & Busca Livre Forense Multicamada
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Varredura investigativa cruzada em arquivos, segredos, snippets e grafo de commits.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Resultados: <strong className="text-zinc-100">{searchResults.length}</strong> encontrados
        </div>
      </div>

      {/* Search Input & Operators */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: password ext:yml sev:critical author:contractor..."
            className="w-full rounded border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:border-cyan-500 focus:outline-hidden"
          />
        </div>

        {/* Quick Operators and Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="text-zinc-500 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Operadores:
          </span>
          <button
            type="button"
            onClick={() => handleAddOperator('sev:critical')}
            className="px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            sev:critical
          </button>
          <button
            type="button"
            onClick={() => handleAddOperator('ext:tf')}
            className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            ext:tf
          </button>
          <button
            type="button"
            onClick={() => handleAddOperator('file:docker')}
            className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            file:docker
          </button>
          <button
            type="button"
            onClick={() => handleAddOperator('author:contractor')}
            className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          >
            author:contractor
          </button>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="ml-auto text-zinc-500 hover:text-zinc-200 underline"
          >
            Limpar Busca
          </button>
        </div>

        {/* Layers Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-2">
          <span className="text-zinc-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Camadas Ativas:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={searchContent}
              onChange={(e) => setSearchContent(e.target.checked)}
              className="accent-cyan-500"
            />
            <span>Segredos & Vulnerabilidades</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={searchCommits}
              onChange={(e) => setSearchCommits(e.target.checked)}
              className="accent-cyan-500"
            />
            <span>Commits & Autores Git</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={searchFiles}
              onChange={(e) => setSearchFiles(e.target.checked)}
              className="accent-cyan-500"
            />
            <span>Arquitetura & Nós de Rede</span>
          </label>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {searchResults.length === 0 ? (
          <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-8 text-center text-xs font-mono text-zinc-500">
            Nenhum resultado corresponde à consulta forense atual.
          </div>
        ) : (
          searchResults.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-3 hover:border-cyan-500/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'secret' ? (
                      <span className="p-1 rounded bg-red-500/10 text-red-400">
                        <KeyRound className="w-3.5 h-3.5" />
                      </span>
                    ) : item.type === 'commit' ? (
                      <span className="p-1 rounded bg-amber-500/10 text-amber-400">
                        <GitCommit className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-cyan-500/10 text-cyan-400">
                        <FileCode className="w-3.5 h-3.5" />
                      </span>
                    )}

                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>

                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      Relevância: {item.matchScore}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, `${item.title}\n${item.snippet}`)}
                    className="p-1 rounded text-zinc-500 hover:text-cyan-400"
                    title="Copiar ocorrência"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <pre className="text-[11px] font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-2 rounded text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                  {item.snippet}
                </pre>

                <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Alvo:</span>
                    {item.type === 'commit' ? (
                      <a
                        href={getGitHubCommitUrl(metadata?.fullName, item.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800"
                        title={`Investigar commit ${item.location} no GitHub`}
                      >
                        <span>Commit {item.location.slice(0, 7)}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-500" />
                      </a>
                    ) : item.location.includes('/') || item.location.includes('.') ? (
                      <a
                        href={(() => {
                          const [pathPart, linePart] = item.location.split(':');
                          const lineNum = linePart ? parseInt(linePart, 10) : undefined;
                          return getGitHubFileUrl(metadata?.fullName, metadata?.defaultBranch, pathPart, lineNum);
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800"
                        title={`Investigar ${item.location} no GitHub`}
                      >
                        <span>{item.location}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-500" />
                      </a>
                    ) : (
                      <code className="text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                        {item.location}
                      </code>
                    )}
                  </div>

                  {item.metadata?.severity && (
                    <Badge variant={item.metadata.severity as any}>
                      {String(item.metadata.severity).toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
