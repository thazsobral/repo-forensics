import {
  ForensicState,
  SearchResultItem,
  SearchFilter,
} from '../types/forensics';

export interface ParsedQuery {
  raw: string;
  terms: string[];
  filePattern?: string;
  extensionPattern?: string;
  authorPattern?: string;
  hashPattern?: string;
  severityPattern?: string;
}

/**
 * Parses advanced forensic query syntax:
 * e.g. "password file:docker ext:yml sev:critical author:contractor"
 */
export function parseForensicQuery(query: string): ParsedQuery {
  const result: ParsedQuery = {
    raw: query,
    terms: [],
  };

  const tokens = query.trim().split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith('file:') || token.startsWith('path:')) {
      result.filePattern = token.split(':')[1]?.toLowerCase();
    } else if (token.startsWith('ext:')) {
      result.extensionPattern = token.split(':')[1]?.toLowerCase().replace(/^\./, '');
    } else if (token.startsWith('author:')) {
      result.authorPattern = token.split(':')[1]?.toLowerCase();
    } else if (token.startsWith('hash:') || token.startsWith('sha:')) {
      result.hashPattern = token.split(':')[1]?.toLowerCase();
    } else if (token.startsWith('sev:') || token.startsWith('severity:')) {
      result.severityPattern = token.split(':')[1]?.toLowerCase();
    } else {
      result.terms.push(token.toLowerCase());
    }
  }

  return result;
}

/**
 * Multi-layer forensic search across files, secrets, code, dependencies, and commit history.
 */
export function performMultilayerSearch(
  filter: SearchFilter,
  state: ForensicState
): SearchResultItem[] {
  const parsed = parseForensicQuery(filter.query);
  const results: SearchResultItem[] = [];

  const matchesTerm = (text: string): boolean => {
    if (parsed.terms.length === 0) return true;
    const lower = text.toLowerCase();
    return parsed.terms.every((term) => lower.includes(term));
  };

  // 1. Search Secrets & Code Findings
  if (filter.searchContent) {
    for (const secret of state.secrets) {
      if (parsed.severityPattern && secret.severity.toLowerCase() !== parsed.severityPattern) {
        continue;
      }
      if (parsed.filePattern && !secret.file.toLowerCase().includes(parsed.filePattern)) {
        continue;
      }
      if (parsed.extensionPattern && !secret.file.toLowerCase().endsWith(`.${parsed.extensionPattern}`)) {
        continue;
      }

      const searchableText = `${secret.category} ${secret.description} ${secret.file} ${secret.matchedString}`;
      if (matchesTerm(searchableText)) {
        results.push({
          id: `search-sec-${secret.id}`,
          type: 'secret',
          title: `${secret.category} (${secret.severity.toUpperCase()})`,
          snippet: `File: ${secret.file}:${secret.line}\nMatched: ${secret.maskedString} [Entropy: ${secret.entropy}]`,
          location: `${secret.file}:${secret.line}`,
          matchScore: 90,
          metadata: {
            severity: secret.severity,
            entropy: secret.entropy,
            line: secret.line,
          },
        });
      }
    }

    // Vulnerabilities search
    for (const vuln of state.vulnerabilities) {
      if (parsed.severityPattern && vuln.severity.toLowerCase() !== parsed.severityPattern) {
        continue;
      }
      const searchableText = `${vuln.title} ${vuln.cve || ''} ${vuln.description} ${vuln.package || ''} ${vuln.location}`;
      if (matchesTerm(searchableText)) {
        results.push({
          id: `search-vuln-${vuln.id}`,
          type: 'code',
          title: `${vuln.cve || 'Vulnerability'}: ${vuln.title}`,
          snippet: `${vuln.description}\nRecommendation: ${vuln.recommendation}`,
          location: vuln.location,
          matchScore: 85,
          metadata: {
            severity: vuln.severity,
            package: vuln.package || '',
          },
        });
      }
    }
  }

  // 2. Search Commits History
  if (filter.searchCommits) {
    for (const commit of state.commits) {
      if (parsed.hashPattern && !commit.sha.toLowerCase().startsWith(parsed.hashPattern)) {
        continue;
      }
      if (parsed.authorPattern && !commit.author.toLowerCase().includes(parsed.authorPattern)) {
        continue;
      }

      const searchableText = `${commit.message} ${commit.author} ${commit.email} ${commit.sha} ${commit.suspiciousKeywordsDetected.join(' ')}`;
      if (matchesTerm(searchableText)) {
        results.push({
          id: `search-commit-${commit.sha}`,
          type: 'commit',
          title: `Commit [${commit.shortSha}] by ${commit.author}`,
          snippet: `Message: "${commit.message}"\nDate: ${commit.date} • Changes: +${commit.additions}/-${commit.deletions}`,
          location: commit.sha,
          matchScore: 75,
          metadata: {
            author: commit.author,
            isAfterHours: commit.isAfterHours ? 1 : 0,
            isPotentialSpoof: commit.isPotentialSpoof ? 1 : 0,
          },
        });
      }
    }
  }

  // 3. Search File Tree Names & Architecture
  if (filter.searchFiles) {
    for (const node of state.architectureNodes) {
      const searchableText = `${node.name} ${node.type} ${node.details}`;
      if (matchesTerm(searchableText)) {
        results.push({
          id: `search-arch-${node.id}`,
          type: 'file',
          title: `Architecture: ${node.name} (${node.type})`,
          snippet: node.details,
          location: node.id,
          matchScore: 60,
          metadata: {
            riskLevel: node.riskLevel,
          },
        });
      }
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
