import React from 'react';
import { Network, Server, Database, Cloud, ShieldAlert, Lock, Radio } from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { Badge } from '../../components/common/Badge';

export const ArchitectureView: React.FC = () => {
  const { architectureNodes } = useRepoStore();

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="w-4 h-4 text-cyan-400" />;
      case 'storage':
        return <Cloud className="w-4 h-4 text-amber-400" />;
      case 'ingress':
        return <Radio className="w-4 h-4 text-indigo-400" />;
      case 'auth':
        return <Lock className="w-4 h-4 text-red-400" />;
      default:
        return <Server className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-500" />
            Topologia de Arquitetura & Superfície de Ataque
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Mapeamento de nós de serviço, banco de dados expostos, portas e limites de confiança.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Nós Identificados: <strong className="text-zinc-100">{architectureNodes.length}</strong>
        </div>
      </div>

      {/* Grid of Architecture Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {architectureNodes.map((node) => (
          <div
            key={node.id}
            className={`rounded border p-3.5 space-y-2 font-mono text-xs transition-colors ${
              node.riskLevel === 'critical'
                ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60'
                : node.riskLevel === 'warning'
                ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-zinc-200 dark:bg-zinc-800">
                  {getNodeIcon(node.type)}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{node.name}</h3>
                  <span className="text-[10px] uppercase text-zinc-500">{node.type}</span>
                </div>
              </div>

              <Badge
                variant={
                  node.riskLevel === 'critical'
                    ? 'critical'
                    : node.riskLevel === 'warning'
                    ? 'medium'
                    : 'success'
                }
              >
                {node.riskLevel.toUpperCase()}
              </Badge>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed pt-1">
              {node.details}
            </p>

            {node.exposedPorts && node.exposedPorts.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                <span className="text-zinc-500">Portas Expostas:</span>
                {node.exposedPorts.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-cyan-400 font-bold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
