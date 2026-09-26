import { create } from 'zustand';
import { ForensicState, RepoMetadata } from '../types/forensics';
import { DEMO_FORENSIC_STATE } from '../data/demoLabData';

export type ActiveForensicView =
  | 'dashboard'
  | 'secrets'
  | 'search'
  | 'supply-chain'
  | 'timeline'
  | 'architecture'
  | 'reports';

export interface RepoStoreState {
  isDemoLab: boolean;
  activeView: ActiveForensicView;
  repoInput: string;
  isAnalyzing: boolean;
  error: string | null;

  // Forensic Data State
  metadata: RepoMetadata | null;
  secrets: ForensicState['secrets'];
  vulnerabilities: ForensicState['vulnerabilities'];
  dependencies: ForensicState['dependencies'];
  commits: ForensicState['commits'];
  architectureNodes: ForensicState['architectureNodes'];
  anomalies: ForensicState['anomalies'];
  securityScore: number;
  shannonThreshold: number;
  aiReport: string | null;

  // Actions
  setActiveView: (view: ActiveForensicView) => void;
  setRepoInput: (val: string) => void;
  setShannonThreshold: (val: number) => void;
  toggleDemoLab: (forceState?: boolean) => void;
  purgeData: () => void;
  clearSession: () => void;
  setAiReport: (report: string | null) => void;
  loadAuditSession: (sessionState: ForensicState) => void;
  setForensicState: (data: Partial<ForensicState>) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setError: (err: string | null) => void;
}

const INITIAL_EMPTY_STATE = {
  metadata: null,
  secrets: [],
  vulnerabilities: [],
  dependencies: [],
  commits: [],
  architectureNodes: [],
  anomalies: [],
  securityScore: 0,
  aiReport: null,
};

export const useRepoStore = create<RepoStoreState>((set, get) => ({
  isDemoLab: true, // Default to demo lab for instant preview
  activeView: 'dashboard',
  repoInput: 'repo-forensics/vulnerable-cloud-service',
  isAnalyzing: false,
  error: null,

  // Initialized with Demo Lab dataset
  metadata: DEMO_FORENSIC_STATE.metadata,
  secrets: DEMO_FORENSIC_STATE.secrets,
  vulnerabilities: DEMO_FORENSIC_STATE.vulnerabilities,
  dependencies: DEMO_FORENSIC_STATE.dependencies,
  commits: DEMO_FORENSIC_STATE.commits,
  architectureNodes: DEMO_FORENSIC_STATE.architectureNodes,
  anomalies: DEMO_FORENSIC_STATE.anomalies,
  securityScore: DEMO_FORENSIC_STATE.securityScore,
  shannonThreshold: DEMO_FORENSIC_STATE.shannonThreshold,
  aiReport: null,

  setActiveView: (view) => set({ activeView: view }),
  setRepoInput: (val) => set({ repoInput: val }),
  setShannonThreshold: (val) => set({ shannonThreshold: val }),
  setAiReport: (report) => set({ aiReport: report }),

  clearSession: () => {
    set({
      isDemoLab: false,
      error: null,
      ...INITIAL_EMPTY_STATE,
    });
  },

  toggleDemoLab: (forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !get().isDemoLab;

    if (nextState) {
      // Activating Demo Lab: Inject simulated vulnerable cloud service dataset
      set({
        isDemoLab: true,
        repoInput: 'repo-forensics/vulnerable-cloud-service',
        error: null,
        metadata: DEMO_FORENSIC_STATE.metadata,
        secrets: DEMO_FORENSIC_STATE.secrets,
        vulnerabilities: DEMO_FORENSIC_STATE.vulnerabilities,
        dependencies: DEMO_FORENSIC_STATE.dependencies,
        commits: DEMO_FORENSIC_STATE.commits,
        architectureNodes: DEMO_FORENSIC_STATE.architectureNodes,
        anomalies: DEMO_FORENSIC_STATE.anomalies,
        securityScore: DEMO_FORENSIC_STATE.securityScore,
        shannonThreshold: DEMO_FORENSIC_STATE.shannonThreshold,
        aiReport: null,
      });
    } else {
      // Deactivating Demo Lab: MANDATORY PURGE of all cached forensic findings
      set({
        isDemoLab: false,
        repoInput: '',
        error: null,
        ...INITIAL_EMPTY_STATE,
      });
    }
  },

  purgeData: () => {
    set({
      error: null,
      ...INITIAL_EMPTY_STATE,
    });
  },

  loadAuditSession: (sessionState: ForensicState) => {
    set({
      isDemoLab: false,
      repoInput: sessionState.metadata?.fullName || '',
      metadata: sessionState.metadata,
      secrets: sessionState.secrets || [],
      vulnerabilities: sessionState.vulnerabilities || [],
      dependencies: sessionState.dependencies || [],
      commits: sessionState.commits || [],
      architectureNodes: sessionState.architectureNodes || [],
      anomalies: sessionState.anomalies || [],
      securityScore: sessionState.securityScore || 0,
      shannonThreshold: sessionState.shannonThreshold || 3.5,
      aiReport: null,
      error: null,
    });
  },

  setForensicState: (data: Partial<ForensicState>) => {
    set((prev) => ({
      ...prev,
      ...data,
    }));
  },

  setIsAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),
  setError: (err: string | null) => set({ error: err }),
}));
