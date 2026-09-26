import { describe, it, expect } from 'vitest';
import {
  parseRepoSlug,
  getGitHubFileUrl,
  getGitHubCommitUrl,
  getPackageRegistryUrl,
  getCveUrl,
} from './github';

describe('GitHub & Registry Link Utilities (github.ts)', () => {
  it('parses repo slugs from various URL formats', () => {
    expect(parseRepoSlug('facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
    expect(parseRepoSlug('https://github.com/torvalds/linux')).toEqual({ owner: 'torvalds', repo: 'linux' });
    expect(parseRepoSlug('https://github.com/expressjs/express.git')).toEqual({ owner: 'expressjs', repo: 'express' });
    expect(parseRepoSlug('')).toBeNull();
  });

  it('constructs correct GitHub file URLs with line anchors', () => {
    const url = getGitHubFileUrl('owner/repo', 'main', 'src/auth/jwt.ts', 42);
    expect(url).toBe('https://github.com/owner/repo/blob/main/src/auth/jwt.ts#L42');

    const defaultUrl = getGitHubFileUrl(null, null, 'infra/docker-compose.yml');
    expect(defaultUrl).toBe('https://github.com/repo-forensics/vulnerable-cloud-service/blob/main/infra/docker-compose.yml');
  });

  it('constructs correct GitHub commit URLs', () => {
    const url = getGitHubCommitUrl('owner/repo', '8f9a2b1e5b8c');
    expect(url).toBe('https://github.com/owner/repo/commit/8f9a2b1e5b8c');
  });

  it('constructs correct Package Registry URLs', () => {
    expect(getPackageRegistryUrl('npm', 'lodash')).toBe('https://www.npmjs.com/package/lodash');
    expect(getPackageRegistryUrl('pypi', 'requests')).toBe('https://pypi.org/project/requests/');
    expect(getPackageRegistryUrl('cargo', 'tokio')).toBe('https://crates.io/crates/tokio');
    expect(getPackageRegistryUrl('go', 'gin-gonic/gin')).toBe('https://pkg.go.dev/gin-gonic%2Fgin');
  });

  it('constructs NVD and Advisory URLs for CVEs', () => {
    expect(getCveUrl('CVE-2023-4863')).toBe('https://nvd.nist.gov/vuln/detail/CVE-2023-4863');
    expect(getCveUrl('')).toBe('https://nvd.nist.gov/');
    expect(getCveUrl('GHSA-xxxx-yyyy')).toBe('https://github.com/advisories?query=GHSA-XXXX-YYYY');
  });
});
