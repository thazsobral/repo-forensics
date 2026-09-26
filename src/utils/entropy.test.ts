import { describe, it, expect } from 'vitest';
import {
  calculateShannonEntropy,
  maskSecret,
  scanTextForSecrets,
  filterSecretsByEntropy,
  SECRET_RULES,
} from './entropy';

describe('Shannon Entropy and Secret Auditor (entropy.ts)', () => {
  it('correctly calculates Shannon entropy for uniform and varied strings', () => {
    // 0 entropy for uniform string
    expect(calculateShannonEntropy('AAAAAAAAAA')).toBe(0);

    // Low entropy for simple pattern
    const lowEntropy = calculateShannonEntropy('ABABABABABAB');
    expect(lowEntropy).toBe(1.0);

    // High entropy for pseudorandom base64/hex hash
    const highEntropy = calculateShannonEntropy('d8F2#kL9@zPq1!xW4$mN7&vC');
    expect(highEntropy).toBeGreaterThan(4.0);
  });

  it('correctly masks sensitive credentials while preserving edge anchors', () => {
    const rawAws = 'AKIAIOSFODNN7EXAMPLE';
    const masked = maskSecret(rawAws);
    expect(masked.startsWith('AKI')).toBe(true);
    expect(masked.endsWith('PLE')).toBe(true);
    expect(masked.includes('***')).toBe(true);
    expect(masked).not.toContain('IOSFODNN7');
  });

  it('contains over 30 forensic secret detection categories', () => {
    expect(SECRET_RULES.length).toBeGreaterThanOrEqual(30);
  });

  it('detects AWS Access Keys with high precision', () => {
    const code = 'const awsKey = "AKIA1234567890ABCDEF";';
    const findings = scanTextForSecrets(code, 'config/aws.ts');
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe('AWS Access Key');
    expect(findings[0].matchedString).toBe('AKIA1234567890ABCDEF');
  });

  it('detects GitHub Personal Access Tokens (ghp_)', () => {
    const token = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = `export const GITHUB_TOKEN = "${token}";`;
    const findings = scanTextForSecrets(code, '.env');
    expect(findings.some((f) => f.category === 'GitHub Personal Access Token')).toBe(true);
  });

  it('detects Google Cloud / Gemini API Keys', () => {
    const code = 'const GEMINI_KEY = "AIzaSyD-mockKeyForTestingEntropyValue123";';
    const findings = scanTextForSecrets(code, 'src/ai.ts');
    expect(findings.some((f) => f.category === 'Google Cloud / Gemini Key')).toBe(true);
  });

  it('detects Database URIs with credentials', () => {
    const code = 'const dbUrl = "postgres://admin:SuperSecretPass123!@db.internal:5432/production";';
    const findings = scanTextForSecrets(code, 'database.js');
    expect(findings.some((f) => f.category === 'Database URI (PostgreSQL)')).toBe(true);
  });

  it('filters findings dynamically based on Shannon entropy threshold', () => {
    const sampleFindings = [
      {
        id: '1',
        category: 'Test Low',
        description: 'Low entropy string',
        matchedString: '111122223333',
        maskedString: '111***333',
        entropy: 1.58,
        file: 'test.txt',
        line: 1,
        severity: 'low' as const,
      },
      {
        id: '2',
        category: 'Test Medium',
        description: 'Medium entropy string',
        matchedString: 'Password123!',
        maskedString: 'Pas***23!',
        entropy: 3.25,
        file: 'test.txt',
        line: 2,
        severity: 'medium' as const,
      },
      {
        id: '3',
        category: 'Test High',
        description: 'High entropy string',
        matchedString: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        maskedString: 'wJa***KEY',
        entropy: 4.87,
        file: 'test.txt',
        line: 3,
        severity: 'critical' as const,
      },
    ];

    // Filter at threshold 3.0
    const filteredAt3 = filterSecretsByEntropy(sampleFindings, 3.0);
    expect(filteredAt3.length).toBe(2);
    expect(filteredAt3.map((f) => f.id)).toEqual(['2', '3']);

    // Filter at threshold 4.5 (forensic cutoff)
    const filteredAt45 = filterSecretsByEntropy(sampleFindings, 4.5);
    expect(filteredAt45.length).toBe(1);
    expect(filteredAt45[0].id).toBe('3');
  });
});
