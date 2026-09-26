import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TimelineView } from './TimelineView';
import { useRepoStore } from '../../store/repo';
import { DEMO_FORENSIC_STATE } from '../../data/demoLabData';

describe('TimelineView with Filters, Sorts, and Links', () => {
  beforeEach(() => {
    useRepoStore.getState().loadAuditSession(DEMO_FORENSIC_STATE);
  });

  it('renders commit timeline with toolbar and initial counts', () => {
    render(<TimelineView />);

    expect(screen.getByText('Linha do Tempo Forense & Anomalias de Commits')).toBeDefined();
    expect(screen.getByPlaceholderText(/Buscar por mensagem, autor/)).toBeDefined();
    expect(screen.getByText(/Anômalos \(/)).toBeDefined();
    expect(screen.getAllByText(/Fora de Expediente \(/).length).toBeGreaterThan(0);
  });

  it('filters commits by text query', () => {
    render(<TimelineView />);

    const searchInput = screen.getByPlaceholderText(/Buscar por mensagem, autor/);
    fireEvent.change(searchInput, { target: { value: 'bypass' } });

    // Should only show commit with message matching "bypass"
    expect(screen.getByText(/bypass token verification/)).toBeDefined();
    expect(screen.queryByText(/patch memory optimization/)).toBeNull();
  });

  it('filters commits by anomaly status', () => {
    render(<TimelineView />);

    // Click on Spoofing filter
    const spoofBtn = screen.getByText(/Spoofing \(/);
    fireEvent.click(spoofBtn);

    expect(screen.getByText('Linus Torvalds')).toBeDefined();
    expect(screen.queryByText('Sarah Chen')).toBeNull();
  });

  it('renders direct GitHub links for commits and suspicious files', () => {
    render(<TimelineView />);

    const links = screen.getAllByRole('link');
    const commitLinks = links.filter((l) => l.getAttribute('href')?.includes('/commit/'));
    expect(commitLinks.length).toBeGreaterThan(0);

    // Check link for suspicious keyword file like .env.backup
    const fileLink = links.find((l) => l.getAttribute('href')?.includes('.env.backup'));
    expect(fileLink).toBeDefined();
  });

  it('renders accurate GMT timestamps in after-hours badges matching the commit date', () => {
    render(<TimelineView />);

    // Commit 1 is at 02:43:18Z -> should display 02:43 GMT in badge
    // Commit 2 is at 23:12:05Z -> should display 23:12 GMT in badge
    const afterHoursBadges = screen.getAllByTestId('badge-after-hours');
    expect(afterHoursBadges.length).toBe(2);

    expect(afterHoursBadges[0].textContent).toContain('Fora de Expediente (02:43 GMT)');
    expect(afterHoursBadges[1].textContent).toContain('Fora de Expediente (23:12 GMT)');

    // Ensure inaccurate generic range is not present
    expect(screen.queryByText(/02:00-06:00 UTC/)).toBeNull();
  });
});
