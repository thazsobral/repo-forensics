import React from 'react';
import { ShieldCheck, EyeOff, Cpu } from 'lucide-react';

interface FooterProps {
  compact?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ compact = false }) => {
  return (
    <footer
      className={`border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/80 px-3 py-2 text-zinc-600 dark:text-zinc-400 text-xs flex flex-wrap items-center justify-between gap-2 select-none`}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-medium tracking-tight">
          repo-forensics • Analisador de repositórios do GitHub • Todos os direitos reservados © 2026
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          100% Client-Side
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-medium">
          <EyeOff className="w-3 h-3 text-cyan-500" />
          Zero Telemetria
        </span>
        {!compact && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[10px] font-mono">
            <Cpu className="w-3 h-3 text-zinc-400" />
            EDD Verified
          </span>
        )}
      </div>
    </footer>
  );
};
