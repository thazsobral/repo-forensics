import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Printer,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  X,
  FileCode,
} from 'lucide-react';
import { useRepoStore } from '../../store/repo';
import { useApiStore } from '../../store/api';
import {
  generateMarkdownReport,
  generatePrintableHtml,
  downloadFile,
  copyToClipboard,
} from '../../utils/export';
import { generateAiForensicReport } from '../../utils/aiReport';
import { SettingsModal } from '../settings/SettingsModal';

export const ReportsView: React.FC = () => {
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

  const { aiApiKey, isAiReady, aiProvider } = useApiStore();

  const [activeTab, setActiveTab] = useState<'static' | 'ai'>('static');
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const markdownContent = generateMarkdownReport({
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

  const handleCopyMarkdown = async () => {
    const textToCopy = activeTab === 'ai' && aiReport ? aiReport : markdownContent;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const repoSlug = metadata?.name || 'repo';
    const textToSave = activeTab === 'ai' && aiReport ? aiReport : markdownContent;
    const filename = `${repoSlug}-forensic-audit-${activeTab === 'ai' ? 'ai-synthesis' : 'report'}.md`;
    downloadFile(filename, textToSave, 'text/markdown');
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
    setPrintNotice(null);
    try {
      window.print();
    } catch {
      setPrintNotice('A janela de impressão direta pode estar restrita no iFrame. Utilize as opções de impressão e exportação rápida abaixo.');
    }
  };

  const handleTriggerPrint = () => {
    try {
      window.print();
    } catch {
      setPrintNotice('A janela de impressão direta pode estar restrita no iFrame. Utilize as opções de impressão e exportação rápida abaixo.');
    }
  };

  const handleDownloadPrintHtml = () => {
    const repoSlug = metadata?.name || 'repo';
    const textToPrint = activeTab === 'ai' && aiReport ? aiReport : markdownContent;
    const title = `Relatório Forense Executivo - ${metadata?.fullName || 'Auditoria'}`;
    const html = generatePrintableHtml(title, textToPrint);
    downloadFile(`${repoSlug}-relatorio-forense-print.html`, html, 'text/html');
  };

  const handleGenerateAiReport = async () => {
    // Strict Guardrail Check
    if (!aiApiKey || aiApiKey.trim().length < 8) {
      setAiError('Ação Bloqueada: Chave de API de IA obrigatória não encontrada no armazenamento local.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const currentState = {
        metadata,
        securityScore,
        secrets,
        vulnerabilities,
        dependencies,
        commits,
        architectureNodes,
        anomalies,
        shannonThreshold,
      };

      const aiSynthesisText = await generateAiForensicReport(currentState, {
        apiKey: aiApiKey,
        provider: aiProvider,
      });

      setAiReport(aiSynthesisText);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Falha na geração via IA');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-4 p-4 text-zinc-900 dark:text-zinc-100 overflow-y-auto">
      {/* Header and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-500" />
            Relatórios Executivos & IA Forense
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Documentação técnica formal em Markdown, exportação para CISO e síntese via LLM Nível 3.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar .md'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Baixar .md</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs between Static and AI Synthesis */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('static')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
            activeTab === 'static'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-cyan-500 font-bold border border-zinc-300 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          Relatório Local em Markdown
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
            activeTab === 'ai'
              ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30'
              : 'text-zinc-500 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Síntese Forense via IA (Nível 3)
        </button>
      </div>

      {/* Tab 1: Static Report Content */}
      {activeTab === 'static' && (
        <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 font-mono text-xs text-zinc-800 dark:text-zinc-200 space-y-4">
          <pre className="whitespace-pre-wrap font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 overflow-x-auto text-[11px]">
            {markdownContent}
          </pre>
        </div>
      )}

      {/* Tab 2: AI Forensics Report with Key Guardrail */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {/* Key Guardrail Check */}
          {!isAiReady ? (
            <div
              data-testid="ai-guardrail-banner"
              className="rounded border border-amber-500/40 bg-amber-500/10 p-4 text-xs font-mono space-y-2 text-amber-300"
            >
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Guardrail Estrito: Chave de API de IA Não Configurada (Nível 3)</span>
              </div>
              <p className="text-zinc-400">
                A geração autônoma de relatórios por Inteligência Artificial requer uma chave de API
                (Google Gemini, OpenAI ou Anthropic) devidamente salva no armazenamento local
                do navegador (Zero Telemetria).
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="rounded bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1.5 transition-colors"
                >
                  Configurar Chave de IA Agora
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    Provedor de IA Ativo: {aiProvider.toUpperCase()}
                  </span>
                  <span className="px-1.5 py-0.2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                    Chave Validada
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sintetizando Vetores...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiReport ? 'Regenerar Síntese IA' : 'Gerar Síntese Forense com IA'}</span>
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs font-mono text-red-400">
                  {aiError}
                </div>
              )}

              {aiReport ? (
                <pre
                  data-testid="ai-report-content"
                  className="whitespace-pre-wrap font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 overflow-x-auto text-[11px] text-zinc-800 dark:text-zinc-200"
                >
                  {aiReport}
                </pre>
              ) : (
                <div className="text-center py-8 text-xs font-mono text-zinc-500 space-y-1">
                  <Sparkles className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                  <p>Pronto para sintetizar conclusões de auditoria via LLM.</p>
                  <p className="text-[11px] text-zinc-600">
                    Clique no botão acima para correlacionar segredos expostos, histórico de commits e falhas de dependência.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Print Preview & Direct Export Modal */}
      {isPrintModalOpen && (
        <div
          data-testid="print-preview-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-4 sm:p-5 text-zinc-900 dark:text-zinc-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-500" />
                <div>
                  <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                    Central de Impressão & Exportação (PDF / A4)
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {metadata?.fullName || 'Repositório'} • {activeTab === 'ai' ? 'Síntese IA (Nível 3)' : 'Relatório Executivo Local'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-medium transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Agora (Ctrl+P)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPrintHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-medium transition-colors"
                  title="Baixa um arquivo HTML autônomo com script de auto-impressão"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Baixar HTML com Auto-Impressão (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-medium transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                Padrão A4 • Alta Densidade
              </span>
            </div>

            {/* Informational notification if iframe restricts direct print */}
            {printNotice && (
              <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs font-mono text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{printNotice}</span>
              </div>
            )}

            {/* A4 Paper Document Preview Container */}
            <div className="flex-1 overflow-y-auto rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-950/80 p-3 sm:p-5 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-zinc-900 rounded shadow-md border border-zinc-300 p-6 sm:p-8 font-mono text-[11px] leading-relaxed select-text space-y-4">
                <div className="border-b-2 border-cyan-600 pb-2 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-cyan-800">
                    repo-forensics • Auditoria de Segurança Forense
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <pre className="whitespace-pre-wrap font-mono text-zinc-800 text-[11px]">
                  {activeTab === 'ai' && aiReport ? aiReport : markdownContent}
                </pre>

                <div className="border-t border-zinc-300 pt-3 text-[10px] text-zinc-500 text-center">
                  repo-forensics • Todos os direitos reservados © 2026 • 100% Client-Side
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2">
              <span className="text-[11px] font-mono text-zinc-500">
                Pressione <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">Esc</kbd> ou clique em Fechar para sair
              </span>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="rounded px-4 py-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
