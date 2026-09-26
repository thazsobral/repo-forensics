import { describe, it, expect } from 'vitest';
import {
  buildAiPromptContext,
  generateDynamicRealisticSynthesis,
  generateAiForensicReport,
} from './aiReport';
import { ForensicState } from '../types/forensics';
import { DEMO_FORENSIC_STATE } from '../data/demoLabData';

const CLEAN_USER_REPO_STATE: ForensicState = {
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
  dependencies: [
    {
      name: 'react',
      version: '19.0.0',
      ecosystem: 'npm',
      direct: true,
      license: 'MIT',
      vulnerabilities: [],
    },
  ],
  commits: [
    {
      sha: '5c58fad000000000000000000000000000000000',
      shortSha: '5c58fad',
      author: 'thazsobral',
      email: '30708148+thazsobral@users.noreply.github.com',
      date: '2026-06-30T20:04:50.000Z',
      message: 'Add MIT License to the project',
      isAfterHours: false,
      isPotentialSpoof: false,
      changedFilesCount: 1,
      additions: 21,
      deletions: 0,
      suspiciousKeywordsDetected: [],
    },
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
    {
      sha: 'd70fe1d000000000000000000000000000000000',
      shortSha: 'd70fe1d',
      author: 'Thalles Sobral',
      email: 'thazsobral@gmail.com',
      date: '2026-06-26T23:46:37.000Z',
      message: 'update site',
      isAfterHours: true,
      isPotentialSpoof: false,
      changedFilesCount: 1,
      additions: 5,
      deletions: 1,
      suspiciousKeywordsDetected: [],
    },
  ],
  architectureNodes: [],
  anomalies: [],
  shannonThreshold: 4.0,
};

describe('AI Forensic Report Generation (aiReport.ts)', () => {
  it('buildAiPromptContext includes exact real JSON and zero fabricated files', () => {
    const prompt = buildAiPromptContext(CLEAN_USER_REPO_STATE);

    expect(prompt).toContain('thazsobral/engenharia-de-requisitos');
    expect(prompt).toContain('"securityScore": 100');
    expect(prompt).toContain('"secretsCount": 0');
    expect(prompt).toContain('"vulnerabilitiesCount": 0');
    expect(prompt).toContain('"commitAnomaliesCount": 2');
    expect(prompt).toContain('b2d4c9e');
    expect(prompt).toContain('update site');

    // Must NOT contain demo lab fabricated paths
    expect(prompt).not.toContain('infra/terraform/aws-provider.tf');
    expect(prompt).not.toContain('ejs@3.1.6');
    expect(prompt).not.toContain('dev-contractor-99');
  });

  it('generates realistic, coherent synthesis for clean repository (100/100 score)', () => {
    const synthesis = generateDynamicRealisticSynthesis(CLEAN_USER_REPO_STATE, 'GEMINI');

    expect(synthesis).toContain('thazsobral/engenharia-de-requisitos');
    expect(synthesis).toContain('Score: 100/100');
    expect(synthesis).toContain('POSTURA SEGURA / CONFORME');
    expect(synthesis).not.toContain('COMPROMETIMENTO IMINENTE');

    // Verifies real findings
    expect(synthesis).toContain('0 credenciais expostas');
    expect(synthesis).toContain('sem registros de vulnerabilidades críticas');
    expect(synthesis).toContain('Thalles Sobral');
    expect(synthesis).toContain('update site');
    expect(synthesis).toContain('Proteção de Branches');

    // Absolute zero hallucinated paths from demo
    expect(synthesis).not.toContain('infra/terraform');
    expect(synthesis).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(synthesis).not.toContain('ejs@3.1.6');
    expect(synthesis).not.toContain('dev-contractor-99');
  });

  it('generates realistic synthesis for demo lab with real secrets when loaded', () => {
    const synthesis = generateDynamicRealisticSynthesis(DEMO_FORENSIC_STATE, 'GEMINI');

    expect(synthesis).toContain('Score: 28/100');
    expect(synthesis).toContain('COMPROMETIMENTO CRÍTICO');
    expect(synthesis).toContain('segredos/credenciais');
    expect(synthesis).toContain('vulnerabilidades (CVEs)');
  });

  it('generateAiForensicReport returns valid formatted markdown matching real repository state', async () => {
    const result = await generateAiForensicReport(CLEAN_USER_REPO_STATE, {
      apiKey: 'test-api-key',
      provider: 'gemini',
    });

    expect(result).toContain('# Síntese Forense Executiva Gerada por IA (Nível 3)');
    expect(result).toContain('thazsobral/engenharia-de-requisitos');
    expect(result).toContain('100/100');
    expect(result).not.toContain('infra/terraform/aws-provider.tf');
  });
});
