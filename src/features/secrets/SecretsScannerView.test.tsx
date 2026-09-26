import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SecretsScannerView } from './SecretsScannerView';
import { useRepoStore } from '../../store/repo';
import { DEMO_FORENSIC_STATE } from '../../data/demoLabData';

describe('SecretsScannerView with Shannon Slider', () => {
  beforeEach(() => {
    useRepoStore.getState().loadAuditSession(DEMO_FORENSIC_STATE);
  });

  it('renders the Shannon entropy slider and default threshold value', () => {
    render(<SecretsScannerView />);

    expect(screen.getByText('Controle Deslizante de Shannon:')).toBeDefined();
    const slider = screen.getByTestId('shannon-slider') as HTMLInputElement;
    expect(slider).toBeDefined();
    expect(slider.value).toBe(DEMO_FORENSIC_STATE.shannonThreshold.toString());
  });

  it('updates threshold dynamically when moving the Shannon slider', () => {
    render(<SecretsScannerView />);

    const slider = screen.getByTestId('shannon-slider');
    fireEvent.change(slider, { target: { value: '4.5' } });

    expect(useRepoStore.getState().shannonThreshold).toBe(4.5);
  });

  it('toggles masking on secret click', () => {
    render(<SecretsScannerView />);

    // Initial state has masked strings like AKI***PLE or similar
    const unmaskButtons = screen.getAllByTitle('Revelar credencial');
    expect(unmaskButtons.length).toBeGreaterThan(0);

    // Click to unmask
    fireEvent.click(unmaskButtons[0]);

    // Now button should offer to mask
    expect(screen.getByTitle('Mascarar credencial')).toBeDefined();
  });
});
