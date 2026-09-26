export type ThemeMode = 'light' | 'dark' | 'system';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecretFinding {
  id: string;
  category: string;
  description: string;
  matchedString: string;
  maskedString: string;
  entropy: number;
  file: string;
  line: number;
  severity: Severity;
  verified?: boolean;
}

export interface VulnerabilityFinding {
  id: string;
  title: string;
  cve?: string;
  severity: Severity;
  package?: string;
  installedVersion?: string;
  patchedVersion?: string;
  description: string;
  location: string;
  recommendation: string;
}

export interface SupplyChainDependency {
  name: string;
  version: string;
  license: string;
  ecosystem: 'npm' | 'pypi' | 'cargo' | 'go' | 'maven';
  direct: boolean;
  vulnerabilities: VulnerabilityFinding[];
  hasKnownMalwarePattern?: boolean;
}

export interface CommitForensic {
  sha: string;
  shortSha: string;
  author: string;
  email: string;
  date: string;
  message: string;
  isAfterHours: boolean;
  isPotentialSpoof: boolean;
  changedFilesCount: number;
  additions: number;
  deletions: number;
  suspiciousKeywordsDetected: string[];
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'external-api' | 'auth' | 'storage' | 'ingress';
  details: string;
  riskLevel: 'safe' | 'warning' | 'critical';
  exposedPorts?: number[];
}

export interface AnomalyMetric {
  category: string;
  score: number; // 0 to 100
  label: string;
  findingCount: number;
}

export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  analyzedAt: string;
  totalFiles: number;
  totalCommits: number;
}

export interface ForensicState {
  metadata: RepoMetadata | null;
  secrets: SecretFinding[];
  vulnerabilities: VulnerabilityFinding[];
  dependencies: SupplyChainDependency[];
  commits: CommitForensic[];
  architectureNodes: ArchitectureNode[];
  anomalies: AnomalyMetric[];
  securityScore: number; // 0 - 100
  shannonThreshold: number; // Default e.g. 4.0
}

export interface SearchFilter {
  query: string;
  searchFiles: boolean;
  searchContent: boolean;
  searchCommits: boolean;
  extensionFilter?: string;
  severityFilter?: Severity | 'all';
}

export interface SearchResultItem {
  id: string;
  type: 'file' | 'code' | 'commit' | 'secret';
  title: string;
  snippet: string;
  location: string;
  matchScore: number;
  metadata?: Record<string, string | number>;
}
