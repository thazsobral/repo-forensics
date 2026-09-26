/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useThemeStore } from './store/theme';
import { useRepoStore } from './store/repo';
import { useApiStore } from './store/api';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DashboardView } from './features/dashboard/DashboardView';
import { SecretsScannerView } from './features/secrets/SecretsScannerView';
import { ForensicExplorerView } from './features/search/ForensicExplorerView';
import { SupplyChainView } from './features/supply-chain/SupplyChainView';
import { TimelineView } from './features/timeline/TimelineView';
import { ArchitectureView } from './features/architecture/ArchitectureView';
import { ReportsView } from './features/reports/ReportsView';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const { initTheme } = useThemeStore();
  const { initCredentials } = useApiStore();
  const { activeView, error, setError, isAnalyzing } = useRepoStore();

  useEffect(() => {
    initTheme();
    initCredentials();
  }, [initTheme, initCredentials]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'secrets':
        return <SecretsScannerView />;
      case 'search':
        return <ForensicExplorerView />;
      case 'supply-chain':
        return <SupplyChainView />;
      case 'timeline':
        return <TimelineView />;
      case 'architecture':
        return <ArchitectureView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-cyan-500/20 selection:text-cyan-400">
      {/* 1. Independent Top Header: spans 100% width, never pushed by sidebar */}
      <Header />

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs font-mono text-red-500 dark:text-red-400 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Main Workspace Layout: Sidebar on Left, Content on Right */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col h-[calc(100vh-49px)] overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex-1 overflow-y-auto">
            {renderActiveView()}
          </div>
          <Footer compact />
        </main>
      </div>
    </div>
  );
}
