import { describe, it, expect, beforeEach } from 'vitest';
import { storage, STORAGE_KEYS } from './storage';

describe('Credential Management and Instant Wipe (storage.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves GitHub Personal Access Token (PAT)', () => {
    const testToken = 'ghp_exampleToken1234567890abcdefghijklm';
    storage.saveGitHubToken(testToken);

    expect(storage.getGitHubToken()).toBe(testToken);
    expect(localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN)).toBe(testToken);
    expect(storage.hasGitHubToken()).toBe(true);
  });

  it('saves and retrieves AI LLM API Key', () => {
    const testKey = 'AIzaSyDemoKeySecretEntropyValue99';
    storage.saveAiKey(testKey);

    expect(storage.getAiKey()).toBe(testKey);
    expect(localStorage.getItem(STORAGE_KEYS.AI_API_KEY)).toBe(testKey);
    expect(storage.hasValidAiKey()).toBe(true);
  });

  it('instantly wipes all credentials and session caches on wipeAllCredentials()', () => {
    storage.saveGitHubToken('ghp_secretTokenToBeWiped');
    storage.saveAiKey('AIzaSyKeyToBeWiped');
    storage.saveAiProvider('gemini');
    localStorage.setItem(STORAGE_KEYS.SESSION_CACHE, '{"temp": 123}');

    expect(storage.hasGitHubToken()).toBe(true);
    expect(storage.hasValidAiKey()).toBe(true);

    // Perform Instant Wipe
    storage.wipeAllCredentials();

    expect(storage.getGitHubToken()).toBeNull();
    expect(storage.getAiKey()).toBeNull();
    expect(storage.hasGitHubToken()).toBe(false);
    expect(storage.hasValidAiKey()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.SESSION_CACHE)).toBeNull();
  });

  it('cleans token when empty string is provided', () => {
    storage.saveGitHubToken('ghp_testTokenInitial');
    storage.saveGitHubToken('   ');
    expect(storage.getGitHubToken()).toBeNull();

    storage.saveAiKey('test-key');
    storage.saveAiKey('');
    expect(storage.getAiKey()).toBeNull();
  });
});
