import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SupplyChainView } from './SupplyChainView';
import { useRepoStore } from '../../store/repo';
import { DEMO_FORENSIC_STATE } from '../../data/demoLabData';

describe('SupplyChainView with Filters, Sorts, and Links', () => {
  beforeEach(() => {
    useRepoStore.getState().loadAuditSession(DEMO_FORENSIC_STATE);
  });

  it('renders SBOM packages and filtering controls', () => {
    render(<SupplyChainView />);

    expect(screen.getByText('Supply Chain, SBOM & Vulnerabilidades de Dependências')).toBeDefined();
    expect(screen.getByPlaceholderText(/Buscar pacote por nome/)).toBeDefined();
    expect(screen.getByText(/Vulneráveis \(/)).toBeDefined();
    expect(screen.getByText(/Malware \(/)).toBeDefined();
  });

  it('filters packages by search query', () => {
    render(<SupplyChainView />);

    const searchInput = screen.getByPlaceholderText(/Buscar pacote por nome/);
    fireEvent.change(searchInput, { target: { value: 'fastify' } });

    expect(screen.getByText('fastify')).toBeDefined();
    expect(screen.queryByText('axios')).toBeNull();
  });

  it('filters packages by risk status (e.g. Malware)', () => {
    render(<SupplyChainView />);

    const malwareBtn = screen.getByText(/Malware \(/);
    fireEvent.click(malwareBtn);

    expect(screen.getByText('event-stream')).toBeDefined();
    expect(screen.queryByText('lodash')).toBeNull();
  });

  it('renders links to package registry, manifest files, and CVE advisories', () => {
    render(<SupplyChainView />);

    const links = screen.getAllByRole('link');
    // NPM registry links
    const npmLink = links.find((l) => l.getAttribute('href')?.includes('npmjs.com/package/'));
    expect(npmLink).toBeDefined();

    // Manifest links
    const manifestLink = links.find((l) => l.getAttribute('href')?.includes('package.json'));
    expect(manifestLink).toBeDefined();

    // CVE links
    const cveLink = links.find((l) => l.getAttribute('href')?.includes('nvd.nist.gov/vuln/detail/CVE-'));
    expect(cveLink).toBeDefined();
  });
});
