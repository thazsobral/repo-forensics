import { describe, it, expect } from 'vitest';
import { parseForensicQuery, performMultilayerSearch } from './search';
import { DEMO_FORENSIC_STATE } from '../data/demoLabData';

describe('Forensic Multilayer Search Explorer (search.ts)', () => {
  it('parses custom query operators correctly', () => {
    const query = 'token file:terraform ext:tf sev:critical author:contractor hash:8f9a2b';
    const parsed = parseForensicQuery(query);

    expect(parsed.terms).toEqual(['token']);
    expect(parsed.filePattern).toBe('terraform');
    expect(parsed.extensionPattern).toBe('tf');
    expect(parsed.severityPattern).toBe('critical');
    expect(parsed.authorPattern).toBe('contractor');
    expect(parsed.hashPattern).toBe('8f9a2b');
  });

  it('searches secrets and code matching term and extension filter', () => {
    const results = performMultilayerSearch(
      {
        query: 'aws ext:tf',
        searchFiles: true,
        searchContent: true,
        searchCommits: true,
      },
      DEMO_FORENSIC_STATE
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.snippet.includes('terraform') || r.title.includes('AWS'))).toBe(true);
  });

  it('searches commit history by author and suspicious behavior', () => {
    const results = performMultilayerSearch(
      {
        query: 'author:contractor',
        searchFiles: false,
        searchContent: false,
        searchCommits: true,
      },
      DEMO_FORENSIC_STATE
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('commit');
    expect(results[0].snippet).toContain('bypass token');
  });

  it('respects severity filter operator in search', () => {
    const criticalResults = performMultilayerSearch(
      {
        query: 'sev:critical',
        searchFiles: false,
        searchContent: true,
        searchCommits: false,
      },
      DEMO_FORENSIC_STATE
    );

    expect(criticalResults.length).toBeGreaterThan(0);
    expect(criticalResults.every((r) => r.metadata?.severity === 'critical')).toBe(true);
  });
});
