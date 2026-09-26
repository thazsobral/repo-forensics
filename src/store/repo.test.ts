import { describe, it, expect, beforeEach } from 'vitest';
import { useRepoStore } from './repo';
import { DEMO_REPO_METADATA } from '../data/demoLabData';

describe('useRepoStore Context Switching and Mandatory Cache Purge (repo.test.ts)', () => {
  beforeEach(() => {
    // Reset to initial demo lab state before each test
    useRepoStore.getState().toggleDemoLab(true);
  });

  it('initializes in Demo Lab mode with injected vulnerable dataset', () => {
    const state = useRepoStore.getState();
    expect(state.isDemoLab).toBe(true);
    expect(state.metadata?.fullName).toBe('repo-forensics/vulnerable-cloud-service');
    expect(state.secrets.length).toBeGreaterThan(0);
    expect(state.vulnerabilities.length).toBeGreaterThan(0);
    expect(state.dependencies.length).toBeGreaterThan(0);
    expect(state.commits.length).toBeGreaterThan(0);
    expect(state.anomalies.length).toBeGreaterThan(0);
    expect(state.securityScore).toBeGreaterThan(0);
  });

  it('executes MANDATORY PURGE of all cached forensic findings when turning Demo Lab OFF', () => {
    // Verify data exists prior to turn-off
    expect(useRepoStore.getState().secrets.length).toBeGreaterThan(0);

    // Turn Demo Lab OFF
    useRepoStore.getState().toggleDemoLab(false);

    const state = useRepoStore.getState();
    expect(state.isDemoLab).toBe(false);
    expect(state.repoInput).toBe('');
    expect(state.metadata).toBeNull();
    expect(state.secrets).toEqual([]);
    expect(state.vulnerabilities).toEqual([]);
    expect(state.dependencies).toEqual([]);
    expect(state.commits).toEqual([]);
    expect(state.architectureNodes).toEqual([]);
    expect(state.anomalies).toEqual([]);
    expect(state.securityScore).toBe(0);
  });

  it('restores simulated dataset when Demo Lab is re-activated', () => {
    // Turn OFF first
    useRepoStore.getState().toggleDemoLab(false);
    expect(useRepoStore.getState().secrets.length).toBe(0);

    // Re-activate Demo Lab
    useRepoStore.getState().toggleDemoLab(true);
    const state = useRepoStore.getState();
    expect(state.isDemoLab).toBe(true);
    expect(state.metadata?.name).toBe('vulnerable-cloud-service');
    expect(state.secrets.length).toBeGreaterThan(0);
    expect(state.vulnerabilities.length).toBeGreaterThan(0);
  });

  it('loads external audit session JSON data correctly', () => {
    const customSession = {
      metadata: {
        ...DEMO_REPO_METADATA,
        fullName: 'external-org/production-app',
      },
      secrets: [],
      vulnerabilities: [],
      dependencies: [],
      commits: [],
      architectureNodes: [],
      anomalies: [],
      securityScore: 88,
      shannonThreshold: 4.2,
    };

    useRepoStore.getState().loadAuditSession(customSession);
    const state = useRepoStore.getState();
    expect(state.isDemoLab).toBe(false);
    expect(state.metadata?.fullName).toBe('external-org/production-app');
    expect(state.securityScore).toBe(88);
    expect(state.shannonThreshold).toBe(4.2);
  });

  it('purges data explicitly on purgeData call', () => {
    expect(useRepoStore.getState().secrets.length).toBeGreaterThan(0);
    useRepoStore.getState().purgeData();
    expect(useRepoStore.getState().secrets).toEqual([]);
    expect(useRepoStore.getState().vulnerabilities).toEqual([]);
    expect(useRepoStore.getState().securityScore).toBe(0);
  });
});
