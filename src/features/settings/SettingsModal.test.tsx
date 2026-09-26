import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettingsModal } from './SettingsModal';
import { useApiStore } from '../../store/api';

describe('SettingsModal Wipe Credentials Interaction', () => {
  beforeEach(() => {
    localStorage.clear();
    useApiStore.getState().setGithubToken('ghp_testToken1234567890');
    useApiStore.getState().setAiApiKey('AIzaSyTestKey12345678');
  });

  it('triggers inline confirmation and wipes credentials cleanly on confirm without browser window.confirm', () => {
    const handleClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={handleClose} />);

    expect(useApiStore.getState().githubToken).toBe('ghp_testToken1234567890');
    expect(useApiStore.getState().aiApiKey).toBe('AIzaSyTestKey12345678');

    // First click on Purgar Credenciais (Wipe)
    const wipeBtn = screen.getByText('Purgar Credenciais (Wipe)');
    fireEvent.click(wipeBtn);

    // Should now show inline confirmation button
    const confirmBtn = screen.getByText('Confirmar Purga Imediata');
    expect(confirmBtn).toBeDefined();

    // Click confirm to purge
    fireEvent.click(confirmBtn);

    // Verify credentials wiped in store and localStorage
    expect(useApiStore.getState().githubToken).toBe('');
    expect(useApiStore.getState().aiApiKey).toBe('');
    expect(useApiStore.getState().isAiReady).toBe(false);
    expect(useApiStore.getState().isGitHubAuthenticated).toBe(false);
    expect(localStorage.getItem('repo_forensics_gh_token')).toBeNull();
    expect(localStorage.getItem('repo_forensics_ai_key')).toBeNull();
  });

  it('cancels purge when clicking Cancelar', () => {
    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    // Click wipe to enter confirmation
    fireEvent.click(screen.getByText('Purgar Credenciais (Wipe)'));
    expect(screen.getByText('Confirmar Purga Imediata')).toBeDefined();

    // Click Cancelar
    fireEvent.click(screen.getByText('Cancelar'));

    // Should return to normal state and credentials remain intact
    expect(screen.getByText('Purgar Credenciais (Wipe)')).toBeDefined();
    expect(useApiStore.getState().githubToken).toBe('ghp_testToken1234567890');
  });

  it('fetches keys from local storage on open, fills inputs, and displays unlocked indicators', () => {
    // Populate localStorage directly
    localStorage.setItem('repo_forensics_gh_token', 'ghp_fromLocalStorage12345678');
    localStorage.setItem('repo_forensics_ai_key', 'AIzaSy_fromLocalStorage12345');

    // Wipe in-memory store to simulate clean open
    useApiStore.setState({
      githubToken: '',
      aiApiKey: '',
      isAiReady: false,
      isGitHubAuthenticated: false,
    });

    render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

    // Verify inputs were pre-filled from local storage
    const ghInput = screen.getByPlaceholderText('ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') as HTMLInputElement;
    const aiInput = screen.getByPlaceholderText('AIzaSy... ou sk-...') as HTMLInputElement;

    expect(ghInput.value).toBe('ghp_fromLocalStorage12345678');
    expect(aiInput.value).toBe('AIzaSy_fromLocalStorage12345');

    // Verify unlocked status indicators are rendered
    expect(screen.getByTestId('gh-unlocked-status')).toBeDefined();
    expect(screen.getByTestId('ai-unlocked-status')).toBeDefined();
    expect(screen.getByTestId('badge-gh-status').textContent).toContain('Desbloqueado');
    expect(screen.getByTestId('badge-ai-status').textContent).toContain('Desbloqueado');

    // Verify in-memory store was also unlocked
    expect(useApiStore.getState().githubToken).toBe('ghp_fromLocalStorage12345678');
    expect(useApiStore.getState().aiApiKey).toBe('AIzaSy_fromLocalStorage12345');
    expect(useApiStore.getState().isGitHubAuthenticated).toBe(true);
    expect(useApiStore.getState().isAiReady).toBe(true);
  });
});
