import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReportsView } from './ReportsView';
import { useRepoStore } from '../../store/repo';
import { useApiStore } from '../../store/api';
import { DEMO_FORENSIC_STATE } from '../../data/demoLabData';

describe('ReportsView and AI Key Guardrail (ReportsView.test.tsx)', () => {
  beforeEach(() => {
    useRepoStore.getState().loadAuditSession(DEMO_FORENSIC_STATE);
    useApiStore.getState().wipeCredentials();
  });

  it('renders the static markdown report tab by default', () => {
    render(<ReportsView />);

    expect(screen.getByText('Relatório Local em Markdown')).toBeDefined();
    expect(screen.getByText(/Executive Forensic Audit Report/)).toBeDefined();
  });

  it('enforces strict guardrail when AI key is missing in Nível 3 tab', () => {
    render(<ReportsView />);

    // Switch to AI tab
    const aiTabButton = screen.getByText(/Síntese Forense via IA/);
    fireEvent.click(aiTabButton);

    // Should display guardrail warning
    const guardrailBanner = screen.getByTestId('ai-guardrail-banner');
    expect(guardrailBanner).toBeDefined();
    expect(guardrailBanner.textContent).toContain('Guardrail Estrito: Chave de API de IA Não Configurada');
  });

  it('unlocks AI synthesis generation when valid AI key is configured', () => {
    // Inject valid AI key into useApiStore
    useApiStore.getState().setAiApiKey('AIzaSyD-validGeminiKeyForReportSynthesis123');

    render(<ReportsView />);

    // Switch to AI tab
    const aiTabButton = screen.getByText(/Síntese Forense via IA/);
    fireEvent.click(aiTabButton);

    // Guardrail banner should not appear
    expect(screen.queryByTestId('ai-guardrail-banner')).toBeNull();
    expect(screen.getByText(/Gerar Síntese Forense com IA/)).toBeDefined();
  });

  it('opens print preview & export modal when clicking Imprimir button', () => {
    render(<ReportsView />);

    // Click Imprimir button
    const printBtn = screen.getByText('Imprimir');
    fireEvent.click(printBtn);

    // Modal should be open
    const modal = screen.getByTestId('print-preview-modal');
    expect(modal).toBeDefined();
    expect(screen.getByText('Central de Impressão & Exportação (PDF / A4)')).toBeDefined();
    expect(screen.getByText('Imprimir Agora (Ctrl+P)')).toBeDefined();
    expect(screen.getByText('Baixar HTML com Auto-Impressão (PDF)')).toBeDefined();

    // Closing the modal
    const closeBtn = screen.getByText('Fechar');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('print-preview-modal')).toBeNull();
  });

  it('generates AI report based on real repository data without hallucinations', async () => {
    // Set a clean repository state in store
    useRepoStore.getState().loadAuditSession({
      metadata: {
        owner: 'thazsobral',
        name: 'engenharia-de-requisitos',
        fullName: 'thazsobral/engenharia-de-requisitos',
        defaultBranch: 'main',
        stars: 2,
        forks: 0,
        openIssues: 0,
        isPrivate: false,
        analyzedAt: '2026-09-26T22:44:35.152Z',
        totalFiles: 15,
        totalCommits: 15,
      },
      securityScore: 100,
      secrets: [],
      vulnerabilities: [],
      dependencies: [],
      commits: [
        {
          sha: 'b2d4c9e000000000000000000000000000000000',
          shortSha: 'b2d4c9e',
          author: 'Thalles Sobral',
          email: 'thazsobral@gmail.com',
          date: '2026-06-26T23:55:07.000Z',
          message: 'update site',
          isAfterHours: true,
          isPotentialSpoof: false,
          changedFilesCount: 2,
          additions: 10,
          deletions: 2,
          suspiciousKeywordsDetected: [],
        },
      ],
      architectureNodes: [],
      anomalies: [],
      shannonThreshold: 4.0,
    });

    useApiStore.getState().setAiApiKey('AIzaSyD-validGeminiKeyForReportSynthesis123');

    render(<ReportsView />);

    // Switch to AI tab
    fireEvent.click(screen.getByText(/Síntese Forense via IA/));

    // Click generate button
    const generateBtn = screen.getByText(/Gerar Síntese Forense com IA/);
    fireEvent.click(generateBtn);

    // Wait for the report content to appear
    const reportContent = await screen.findByTestId('ai-report-content');
    expect(reportContent.textContent).toContain('thazsobral/engenharia-de-requisitos');
    expect(reportContent.textContent).toContain('Score: 100/100');
    expect(reportContent.textContent).toContain('Thalles Sobral');
    expect(reportContent.textContent).toContain('update site');

    // Hallucinated demo data must NOT be present
    expect(reportContent.textContent).not.toContain('infra/terraform');
    expect(reportContent.textContent).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(reportContent.textContent).not.toContain('dev-contractor-99');
  });
});
