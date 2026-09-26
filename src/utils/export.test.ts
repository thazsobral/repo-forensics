import { describe, it, expect } from 'vitest';
import {
  generateMarkdownReport,
  generatePrintableHtml,
  exportSessionToJson,
  importSessionFromJson,
} from './export';
import { DEMO_FORENSIC_STATE } from '../data/demoLabData';

describe('Forensic Report & Session Persistence (export.ts)', () => {
  it('generates a rich markdown report with all critical sections', () => {
    const markdown = generateMarkdownReport(DEMO_FORENSIC_STATE);

    expect(markdown).toContain('# Executive Forensic Audit Report');
    expect(markdown).toContain('Security Posture Score');
    expect(markdown).toContain('Hardcoded Credentials & Entropy Breakdown');
    expect(markdown).toContain('Vulnerability & CVE Supply Chain Findings');
    expect(markdown).toContain('Immediate Remediation Action Plan');
    expect(markdown).toContain('repo-forensics • Todos os direitos reservados © 2026');
    expect(markdown).toContain('Shannon Entropy');
  });

  it('exports session state to valid JSON payload', () => {
    const jsonStr = exportSessionToJson(DEMO_FORENSIC_STATE);
    expect(typeof jsonStr).toBe('string');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.generator).toBe('repo-forensics');
    expect(parsed.data.securityScore).toBe(DEMO_FORENSIC_STATE.securityScore);
    expect(parsed.data.secrets.length).toBe(DEMO_FORENSIC_STATE.secrets.length);
  });

  it('imports valid JSON session into ForensicState structure', () => {
    const jsonStr = exportSessionToJson(DEMO_FORENSIC_STATE);
    const restored = importSessionFromJson(jsonStr);

    expect(restored.metadata?.fullName).toBe(DEMO_FORENSIC_STATE.metadata?.fullName);
    expect(restored.secrets.length).toBe(DEMO_FORENSIC_STATE.secrets.length);
    expect(restored.securityScore).toBe(DEMO_FORENSIC_STATE.securityScore);
    expect(restored.shannonThreshold).toBe(DEMO_FORENSIC_STATE.shannonThreshold);
  });

  it('throws descriptive error on malformed JSON import', () => {
    expect(() => importSessionFromJson('{ invalid json content')).toThrowError(
      /Failed to import forensic audit session/
    );
  });

  it('generates print-ready HTML document with auto-print script and print styling', () => {
    const html = generatePrintableHtml('Relatório de Teste', '# Título\n- Item 1\n- Item 2');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Relatório de Teste</title>');
    expect(html).toContain('@media print');
    expect(html).toContain('window.print()');
    expect(html).toContain('<h1>Título</h1>');
    expect(html).toContain('<li>Item 1</li>');
  });
});
