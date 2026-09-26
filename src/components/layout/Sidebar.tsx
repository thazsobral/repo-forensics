import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  KeyRound,
  Search,
  Boxes,
  GitCommit,
  Network,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useRepoStore, ActiveForensicView } from '../../store/repo';
import { storage } from '../../utils/storage';
import { filterSecretsByEntropy } from '../../utils/entropy';

interface NavItem {
  id: ActiveForensicView;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
  badgeLabel?: string;
  badgeVariant?: 'critical' | 'high' | 'medium' | 'low' | 'neutral' | 'accent';
}

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    secrets,
    vulnerabilities,
    dependencies,
    commits,
    architectureNodes,
    shannonThreshold,
    securityScore,
  } = useRepoStore();

  const [collapsed, setCollapsed] = useState<boolean>(() => storage.getSidebarState());

  useEffect(() => {
    storage.saveSidebarState(collapsed);
  }, [collapsed]);

  // Calculate dynamic findings count
  const activeSecrets = filterSecretsByEntropy(secrets, shannonThreshold);
  const vulnerableDeps = dependencies.filter((d) => d.vulnerabilities.length > 0);
  const suspiciousCommits = commits.filter((c) => c.isAfterHours || c.isPotentialSpoof);
  const exposedNodes = architectureNodes.filter((n) => n.riskLevel === 'critical' || n.riskLevel === 'warning');

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Forense',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badgeLabel: `${securityScore}/100`,
      badgeVariant: securityScore < 50 ? 'critical' : securityScore < 80 ? 'medium' : 'neutral',
    },
    {
      id: 'secrets',
      label: 'Auditor de Segredos',
      icon: <KeyRound className="w-4 h-4" />,
      badgeCount: activeSecrets.length,
      badgeVariant: activeSecrets.length > 0 ? 'critical' : 'neutral',
    },
    {
      id: 'search',
      label: 'Busca Multicamada',
      icon: <Search className="w-4 h-4" />,
      badgeLabel: 'Filtros',
      badgeVariant: 'accent',
    },
    {
      id: 'supply-chain',
      label: 'Supply Chain & SBOM',
      icon: <Boxes className="w-4 h-4" />,
      badgeCount: vulnerableDeps.length,
      badgeVariant: vulnerableDeps.length > 0 ? 'high' : 'neutral',
    },
    {
      id: 'timeline',
      label: 'Linha do Tempo Git',
      icon: <GitCommit className="w-4 h-4" />,
      badgeCount: suspiciousCommits.length,
      badgeVariant: suspiciousCommits.length > 0 ? 'medium' : 'neutral',
    },
    {
      id: 'architecture',
      label: 'Arquitetura & Ataque',
      icon: <Network className="w-4 h-4" />,
      badgeCount: exposedNodes.length,
      badgeVariant: exposedNodes.length > 0 ? 'critical' : 'neutral',
    },
    {
      id: 'reports',
      label: 'Relatórios & IA',
      icon: <FileText className="w-4 h-4" />,
      badgeLabel: 'Nível 3',
      badgeVariant: 'accent',
    },
  ];

  return (
    <aside
      className={`h-[calc(100vh-49px)] border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col justify-between transition-all duration-200 shrink-0 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Top Nav Items */}
      <div className="p-2 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          {!collapsed && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Navegação Forense
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir Sidebar' : 'Recolher Sidebar'}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={collapsed ? `${item.label} (${item.badgeCount ?? item.badgeLabel ?? ''})` : undefined}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-mono transition-all ${
                isActive
                  ? 'bg-zinc-200 dark:bg-zinc-800/90 text-cyan-600 dark:text-cyan-400 font-semibold border-l-2 border-cyan-500'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={isActive ? 'text-cyan-500' : 'text-zinc-400'}>{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center shrink-0">
                  {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        item.badgeVariant === 'critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : item.badgeVariant === 'high'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : item.badgeVariant === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}

                  {item.badgeLabel && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        item.badgeVariant === 'critical'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-bold'
                          : item.badgeVariant === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : item.badgeVariant === 'accent'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {item.badgeLabel}
                    </span>
                  )}
                </div>
              )}

              {collapsed && typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer with mandatory text & badges */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 bg-white/40 dark:bg-zinc-950/40">
        {!collapsed ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono text-zinc-500 leading-tight">
              repo-forensics • Todos os direitos reservados © 2026
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-block px-1.5 py-0.2 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[9px] font-mono font-medium">
                100% Client-Side
              </span>
              <span className="inline-block px-1.5 py-0.2 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-500 text-[9px] font-mono font-medium">
                Zero Telemetria
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[9px] font-mono text-zinc-500" title="repo-forensics • © 2026">
            <ShieldAlert className="w-4 h-4 text-cyan-500" />
            <span>2026</span>
          </div>
        )}
      </div>
    </aside>
  );
};
