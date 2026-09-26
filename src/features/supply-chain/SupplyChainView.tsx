import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Package,
  Search,
  Filter,
  ArrowUpDown,
  FileCode,
} from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { getPackageRegistryUrl, getCveUrl, getGitHubFileUrl } from '../../utils/github';
import { Badge } from '../../components/common/Badge';

export const SupplyChainView: React.FC = () => {
  const { dependencies, vulnerabilities, metadata } = useRepoStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'vulnerable' | 'malware' | 'safe'>('all');
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'npm' | 'pypi' | 'cargo' | 'go' | 'maven'>('all');
  const [directFilter, setDirectFilter] = useState<'all' | 'direct' | 'transitive'>('all');
  const [sortBy, setSortBy] = useState<'risk-desc' | 'vulns-desc' | 'name-asc' | 'name-desc' | 'ecosystem'>('risk-desc');

  const vulnerableCount = dependencies.filter((d) => d.vulnerabilities.length > 0).length;
  const malwareCount = dependencies.filter((d) => d.hasKnownMalwarePattern).length;

  const filteredAndSortedDeps = useMemo(() => {
    const result = dependencies.filter((dep) => {
      // Risk status filter
      if (riskFilter === 'vulnerable') {
        if (dep.vulnerabilities.length === 0) return false;
      } else if (riskFilter === 'malware') {
        if (!dep.hasKnownMalwarePattern) return false;
      } else if (riskFilter === 'safe') {
        if (dep.vulnerabilities.length > 0 || dep.hasKnownMalwarePattern) return false;
      }

      // Ecosystem filter
      if (ecosystemFilter !== 'all' && dep.ecosystem !== ecosystemFilter) {
        return false;
      }

      // Direct vs Transitive filter
      if (directFilter === 'direct' && !dep.direct) return false;
      if (directFilter === 'transitive' && dep.direct) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dep.name.toLowerCase().includes(q);
        const matchesVersion = dep.version.toLowerCase().includes(q);
        const matchesLicense = dep.license.toLowerCase().includes(q);
        const matchesVuln = dep.vulnerabilities.some(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            (v.cve && v.cve.toLowerCase().includes(q)) ||
            v.description.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesVersion && !matchesLicense && !matchesVuln) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'risk-desc') {
        const getScore = (dep: typeof a) => {
          if (dep.hasKnownMalwarePattern) return 100;
          if (dep.vulnerabilities.some((v) => v.severity === 'critical')) return 80;
          if (dep.vulnerabilities.some((v) => v.severity === 'high')) return 60;
          if (dep.vulnerabilities.some((v) => v.severity === 'medium')) return 40;
          if (dep.vulnerabilities.length > 0) return 20;
          return 0;
        };
        const diff = getScore(b) - getScore(a);
        if (diff !== 0) return diff;
        return b.vulnerabilities.length - a.vulnerabilities.length;
      }
      if (sortBy === 'vulns-desc') {
        const diff = b.vulnerabilities.length - a.vulnerabilities.length;
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'ecosystem') {
        return a.ecosystem.localeCompare(b.ecosystem);
      }
      return 0;
    });
  }, [dependencies, riskFilter, ecosystemFilter, directFilter, searchQuery, sortBy]);

  const getManifestFilename = (ecosystem: string) => {
    switch (ecosystem) {
      case 'npm':
        return 'package.json';
      case 'pypi':
        return 'requirements.txt';
      case 'cargo':
        return 'Cargo.toml';
      case 'go':
        return 'go.mod';
      case 'maven':
        return 'pom.xml';
      default:
        return 'package.json';
    }
  };

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <Boxes className="w-4 h-4 text-orange-400" />
            Supply Chain, SBOM & Vulnerabilidades de Dependências
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Mapeamento de pacotes diretos/transitivos, análise de CVEs conhecidas e risco de licença.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Exibindo:</span>
          <strong className="text-zinc-900 dark:text-zinc-100">
            {filteredAndSortedDeps.length} de {dependencies.length} pacotes
          </strong>
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
              placeholder="Buscar pacote por nome, CVE, licença..."
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
              <option value="risk-desc">Severidade (Mais Críticos Primeiro)</option>
              <option value="vulns-desc">Quantidade de CVEs (Mais Vulneráveis)</option>
              <option value="name-asc">Nome do Pacote (A → Z)</option>
              <option value="name-desc">Nome do Pacote (Z → A)</option>
              <option value="ecosystem">Ecossistema</option>
            </select>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
          <span className="text-zinc-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-zinc-400" /> Status:
          </span>

          <button
            type="button"
            onClick={() => setRiskFilter('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              riskFilter === 'all'
                ? 'bg-zinc-800 text-cyan-400 font-bold border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Todos ({dependencies.length})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('vulnerable')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              riskFilter === 'vulnerable'
                ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            Vulneráveis ({vulnerableCount})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('malware')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              riskFilter === 'malware'
                ? 'bg-red-600/25 text-red-400 font-bold border border-red-500/40'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Malware ({malwareCount})
          </button>

          <button
            type="button"
            onClick={() => setRiskFilter('safe')}
            className={`px-2 py-0.5 rounded transition-colors ${
              riskFilter === 'safe'
                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Seguras ({dependencies.length - vulnerableCount - malwareCount})
          </button>

          {/* Direct vs Transitive */}
          <div className="flex items-center gap-1 border-l border-zinc-300 dark:border-zinc-700 pl-2 ml-1">
            <span className="text-zinc-500">Origem:</span>
            {(['all', 'direct', 'transitive'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDirectFilter(mode)}
                className={`px-1.5 py-0.5 rounded capitalize ${
                  directFilter === mode
                    ? 'bg-zinc-700 text-cyan-300 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode === 'all' ? 'Todas' : mode === 'direct' ? 'Diretas' : 'Transitivas'}
              </button>
            ))}
          </div>

          {(searchQuery || riskFilter !== 'all' || directFilter !== 'all' || ecosystemFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRiskFilter('all');
                setDirectFilter('all');
                setEcosystemFilter('all');
              }}
              className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-200 underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Dependencies Table */}
      <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        {filteredAndSortedDeps.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500">
            Nenhuma dependência atende aos filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredAndSortedDeps.map((dep) => {
              const hasIssues = dep.vulnerabilities.length > 0 || dep.hasKnownMalwarePattern;
              const registryUrl = getPackageRegistryUrl(dep.ecosystem, dep.name);
              const manifestFile = getManifestFilename(dep.ecosystem);
              const manifestUrl = getGitHubFileUrl(metadata?.fullName, metadata?.defaultBranch, manifestFile);

              return (
                <div key={dep.name} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Package className="w-4 h-4 text-zinc-400 shrink-0" />

                      {/* Active link to official Package Registry */}
                      <a
                        href={registryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 inline-flex items-center gap-1 group transition-colors"
                        title={`Investigar pacote ${dep.name} no registro oficial (${dep.ecosystem})`}
                      >
                        <span>{dep.name}</span>
                        <ExternalLink className="w-3 h-3 text-cyan-500 group-hover:translate-x-0.5 transition-transform" />
                      </a>

                      <span className="font-mono text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-300 dark:border-zinc-700">
                        v{dep.version}
                      </span>

                      <span className="text-[10px] font-mono text-zinc-500">
                        Licença: {dep.license}
                      </span>

                      <span className="text-[10px] font-mono uppercase text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-1 py-0.2 rounded border border-zinc-300 dark:border-zinc-800">
                        [{dep.ecosystem}]
                      </span>

                      <span
                        className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                          dep.direct
                            ? 'text-cyan-500 bg-cyan-500/10 border border-cyan-500/20'
                            : 'text-zinc-400 bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      >
                        {dep.direct ? 'Direta' : 'Transitiva'}
                      </span>

                      {/* Link to manifest in GitHub */}
                      <a
                        href={manifestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-cyan-400 hover:underline transition-colors ml-1"
                        title={`Investigar declaração no arquivo ${manifestFile} do repositório`}
                      >
                        <FileCode className="w-3 h-3" />
                        <span>Manifesto ({manifestFile})</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div>
                      {dep.hasKnownMalwarePattern ? (
                        <Badge variant="critical">PADRÃO MALICIOSO</Badge>
                      ) : dep.vulnerabilities.length > 0 ? (
                        <Badge variant="high">{dep.vulnerabilities.length} CVEs</Badge>
                      ) : (
                        <Badge variant="success">SEGURO</Badge>
                      )}
                    </div>
                  </div>

                  {/* Vulnerability details with direct NVD links */}
                  {dep.vulnerabilities.length > 0 && (
                    <div className="pl-6 space-y-1.5 pt-1">
                      {dep.vulnerabilities.map((v) => (
                        <div
                          key={v.id}
                          className="rounded border border-red-500/20 bg-red-500/5 p-2 text-xs font-mono space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />

                              {/* Active link to CVE database */}
                              <a
                                href={getCveUrl(v.cve)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-red-400 hover:underline inline-flex items-center gap-1 group"
                                title={`Investigar ${v.cve || 'vulnerabilidade'} no banco oficial do NVD`}
                              >
                                <span>{v.cve || 'Vulnerabilidade'}: {v.title}</span>
                                <ExternalLink className="w-3 h-3 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                              </a>
                            </div>

                            <Badge variant={v.severity}>{v.severity.toUpperCase()}</Badge>
                          </div>

                          <p className="text-[11px] text-zinc-400 font-sans">{v.description}</p>
                          <div className="text-[10px] text-cyan-400 pt-0.5">
                            <strong>Remediação:</strong> {v.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

