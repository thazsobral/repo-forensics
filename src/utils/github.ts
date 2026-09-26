import {
  RepoMetadata,
  CommitForensic,
  SecretFinding,
  VulnerabilityFinding,
  SupplyChainDependency,
  ArchitectureNode,
  AnomalyMetric,
  ForensicState,
} from '../types/forensics';
import { scanTextForSecrets } from './entropy';

export interface GitHubParseResult {
  owner: string;
  repo: string;
}

export function parseRepoSlug(input: string): GitHubParseResult | null {
  if (!input || !input.trim()) return null;

  let cleaned = input.trim().replace(/\/+$/, '');

  // Handle URL format: https://github.com/owner/repo or git@github.com:owner/repo
  if (cleaned.includes('github.com/')) {
    const parts = cleaned.split('github.com/')[1].split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
    }
  }

  // Handle slug format: owner/repo
  const parts = cleaned.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  return null;
}

interface GitHubApiResponseHeaders {
  remaining?: number;
  limit?: number;
  reset?: string;
}

export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  token?: string,
  onRateLimit?: (info: { remaining: number; limit: number; reset: string }) => void
): Promise<ForensicState> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const checkHeaders = (res: Response) => {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const limit = res.headers.get('x-ratelimit-limit');
    const reset = res.headers.get('x-ratelimit-reset');

    if (remaining && limit && onRateLimit) {
      const resetDate = reset ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString() : 'N/A';
      onRateLimit({
        remaining: parseInt(remaining, 10),
        limit: parseInt(limit, 10),
        reset: resetDate,
      });
    }
  };

  // 1. Fetch Repository Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  checkHeaders(repoRes);

  if (!repoRes.ok) {
    if (repoRes.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Add a Personal Access Token (PAT) in Settings.');
    }
    if (repoRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or is private.`);
    }
    throw new Error(`GitHub API error (${repoRes.status}): ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();

  const metadata: RepoMetadata = {
    owner: repoData.owner.login,
    name: repoData.name,
    fullName: repoData.full_name,
    defaultBranch: repoData.default_branch || 'main',
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    isPrivate: repoData.private,
    analyzedAt: new Date().toISOString(),
    totalFiles: 0,
    totalCommits: 0,
  };

  // 2. Fetch Commits
  const commits: CommitForensic[] = [];
  try {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`,
      { headers }
    );
    checkHeaders(commitsRes);

    if (commitsRes.ok) {
      const commitsJson = await commitsRes.json();
      for (const c of commitsJson) {
        const commitDate = new Date(c.commit.author?.date || c.commit.committer?.date);
        const hour = commitDate.getUTCHours();
        // After-hours: between 22:00 and 06:00 UTC
        const isAfterHours = hour >= 22 || hour <= 6;
        const msg = c.commit.message || '';
        const authorName = c.commit.author?.name || 'Unknown';
        const authorEmail = c.commit.author?.email || 'unknown';

        const suspiciousKeywords: string[] = [];
        const suspRegex = /(bypass|hotfix|token|secret|password|temp|disable|hack|eval|backdoor)/gi;
        let match;
        while ((match = suspRegex.exec(msg)) !== null) {
          if (!suspiciousKeywords.includes(match[0].toLowerCase())) {
            suspiciousKeywords.push(match[0].toLowerCase());
          }
        }

        const isPotentialSpoof =
          authorEmail.includes('torvalds') ||
          authorEmail.includes('noreply') === false && !authorEmail.includes('@');

        commits.push({
          sha: c.sha,
          shortSha: c.sha.substring(0, 7),
          author: authorName,
          email: authorEmail,
          date: commitDate.toISOString(),
          message: msg.split('\n')[0],
          isAfterHours,
          isPotentialSpoof,
          changedFilesCount: 1,
          additions: 0,
          deletions: 0,
          suspiciousKeywordsDetected: suspiciousKeywords,
        });
      }
    }
  } catch {
    // Continue even if commits fail
  }

  // 3. Fetch Tree & Analyze critical files
  const secrets: SecretFinding[] = [];
  const vulnerabilities: VulnerabilityFinding[] = [];
  const dependencies: SupplyChainDependency[] = [];
  const architectureNodes: ArchitectureNode[] = [
    {
      id: 'arch-gh-repo',
      name: `${repoData.full_name}`,
      type: 'service',
      details: `Language: ${repoData.language || 'Multi-language'} • Default branch: ${repoData.default_branch}`,
      riskLevel: 'safe',
    },
  ];

  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${metadata.defaultBranch}?recursive=1`,
      { headers }
    );
    checkHeaders(treeRes);

    if (treeRes.ok) {
      const treeJson = await treeRes.json();
      const files = treeJson.tree || [];
      metadata.totalFiles = files.length;
      metadata.totalCommits = commits.length;

      // Filter critical security files to scan content: package.json, docker-compose, .env*, config files
      const highValueFiles = files
        .filter((f: { path: string; type: string; size?: number }) => {
          if (f.type !== 'blob') return false;
          const p = f.path.toLowerCase();
          return (
            p === 'package.json' ||
            p.includes('.env') ||
            p.endsWith('.yml') ||
            p.endsWith('.yaml') ||
            p.endsWith('.json') ||
            p.endsWith('.ts') ||
            p.endsWith('.js') ||
            p.endsWith('.py') ||
            p.includes('docker')
          );
        })
        .slice(0, 15); // limit API calls to respect rate limit

      for (const item of highValueFiles) {
        try {
          const fileRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
            { headers }
          );
          checkHeaders(fileRes);

          if (fileRes.ok) {
            const fileJson = await fileRes.json();
            if (fileJson.content && fileJson.encoding === 'base64') {
              const decoded = atob(fileJson.content.replace(/\s/g, ''));

              // Scan for secrets
              const fileSecrets = scanTextForSecrets(decoded, item.path, 3.0);
              secrets.push(...fileSecrets);

              // If package.json, parse dependencies
              if (item.path === 'package.json') {
                try {
                  const pkg = JSON.parse(decoded);
                  const allDeps = {
                    ...(pkg.dependencies || {}),
                    ...(pkg.devDependencies || {}),
                  };

                  for (const [depName, version] of Object.entries(allDeps)) {
                    dependencies.push({
                      name: depName,
                      version: String(version).replace(/[\^~]/g, ''),
                      license: 'Unknown',
                      ecosystem: 'npm',
                      direct: true,
                      vulnerabilities: [],
                    });
                  }
                } catch {
                  // Ignore JSON parse error
                }
              }
            }
          }
        } catch {
          // Continue
        }
      }
    }
  } catch {
    // Continue
  }

  // Calculate dynamic security score (100 is perfect, drops with findings)
  const criticalCount = secrets.filter((s) => s.severity === 'critical').length;
  const highCount = secrets.filter((s) => s.severity === 'high').length;
  const mediumCount = secrets.filter((s) => s.severity === 'medium').length;

  let calculatedScore = 100 - (criticalCount * 25 + highCount * 12 + mediumCount * 5);
  if (calculatedScore < 10 && (criticalCount > 0 || highCount > 0)) calculatedScore = 15;
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  const anomalies: AnomalyMetric[] = [
    {
      category: 'Hardcoded Secrets',
      score: Math.min(100, criticalCount * 30 + highCount * 15),
      label: criticalCount > 0 ? 'Critical Danger' : 'Monitored',
      findingCount: secrets.length,
    },
    {
      category: 'Git Commit Anomalies',
      score: commits.filter((c) => c.isAfterHours || c.isPotentialSpoof).length * 25,
      label: 'Suspicious Churn',
      findingCount: commits.filter((c) => c.isAfterHours || c.isPotentialSpoof).length,
    },
  ];

  return {
    metadata,
    secrets,
    vulnerabilities,
    dependencies,
    commits,
    architectureNodes,
    anomalies,
    securityScore: calculatedScore,
    shannonThreshold: 3.5,
  };
}

/**
 * Constructs direct URL to investigate a file on GitHub at specified branch and line.
 */
export function getGitHubFileUrl(
  repoFullName?: string | null,
  defaultBranch?: string | null,
  filePath?: string,
  line?: number
): string {
  const repo = repoFullName || 'repo-forensics/vulnerable-cloud-service';
  const branch = defaultBranch || 'main';
  if (!filePath) return `https://github.com/${repo}`;
  const cleanPath = filePath.replace(/^\/+/, '');
  const lineAnchor = line && line > 0 ? `#L${line}` : '';
  return `https://github.com/${repo}/blob/${branch}/${cleanPath}${lineAnchor}`;
}

/**
 * Constructs direct URL to inspect a commit on GitHub.
 */
export function getGitHubCommitUrl(
  repoFullName?: string | null,
  commitSha?: string
): string {
  const repo = repoFullName || 'repo-forensics/vulnerable-cloud-service';
  if (!commitSha) return `https://github.com/${repo}/commits`;
  return `https://github.com/${repo}/commit/${commitSha}`;
}

/**
 * Constructs direct link to package registry for SBOM dependencies.
 */
export function getPackageRegistryUrl(ecosystem: string, packageName: string): string {
  switch (ecosystem.toLowerCase()) {
    case 'npm':
      return `https://www.npmjs.com/package/${encodeURIComponent(packageName)}`;
    case 'pypi':
      return `https://pypi.org/project/${encodeURIComponent(packageName)}/`;
    case 'cargo':
      return `https://crates.io/crates/${encodeURIComponent(packageName)}`;
    case 'go':
      return `https://pkg.go.dev/${encodeURIComponent(packageName)}`;
    case 'maven':
      return `https://central.sonatype.com/search?q=${encodeURIComponent(packageName)}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(packageName + ' ' + ecosystem)}`;
  }
}

/**
 * Constructs direct link to NVD (National Vulnerability Database) or CVE details.
 */
export function getCveUrl(cveId?: string): string {
  if (!cveId || !cveId.trim()) {
    return 'https://nvd.nist.gov/';
  }
  const clean = cveId.trim().toUpperCase();
  if (clean.startsWith('CVE-')) {
    return `https://nvd.nist.gov/vuln/detail/${clean}`;
  }
  return `https://github.com/advisories?query=${encodeURIComponent(clean)}`;
}

