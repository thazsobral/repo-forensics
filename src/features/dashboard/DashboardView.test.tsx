import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DashboardView } from './DashboardView';
import { useRepoStore } from '../../store/repo';
import { DEMO_FORENSIC_STATE } from '../../data/demoLabData';

describe('DashboardView Component', () => {
  beforeEach(() => {
    useRepoStore.getState().loadAuditSession(DEMO_FORENSIC_STATE);
  });

  it('renders the repository name and calculated security posture score', () => {
    render(<DashboardView />);

    expect(screen.getByText('repo-forensics/vulnerable-cloud-service')).toBeDefined();
    const scoreElement = screen.getByTestId('posture-score-value');
    expect(scoreElement.textContent).toContain('28');
  });

  it('displays the anomaly vector categories and counts', () => {
    render(<DashboardView />);

    expect(screen.getByText('Hardcoded Secrets')).toBeDefined();
    expect(screen.getByText('Supply Chain Vulnerabilities')).toBeDefined();
    expect(screen.getByText('Git Commit Anomalies')).toBeDefined();
  });

  it('triggers view navigation when clicking the Segredos card', () => {
    render(<DashboardView />);

    const secretsCard = screen.getByText('Segredos').closest('div');
    if (secretsCard) {
      fireEvent.click(secretsCard);
      expect(useRepoStore.getState().activeView).toBe('secrets');
    }
  });
});
