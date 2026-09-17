import { create } from 'zustand';

interface TelemetryState {
  timeToFirstAction: number; // in ms
  hesitationPauses: number; // count
  answerFlips: number; // count
  activeModality: 'TEXT' | 'VISUAL' | 'AUDIO';
  
  // Actions
  recordFirstAction: (ms: number) => void;
  incrementHesitation: () => void;
  incrementAnswerFlip: () => void;
  setModality: (modality: 'TEXT' | 'VISUAL' | 'AUDIO') => void;
  resetTelemetry: () => void;
}

interface SessionState {
  studentId: string | null;
  currentProblemId: string | null;
  currentNodeId: string | null;
  
  // Actions
  setSession: (studentId: string, nodeId: string) => void;
  setCurrentProblem: (problemId: string) => void;
  resetSession: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  timeToFirstAction: 0,
  hesitationPauses: 0,
  answerFlips: 0,
  activeModality: 'TEXT',

  recordFirstAction: (ms) => set((state) => {
    // Only record the first action if it hasn't been recorded yet
    if (state.timeToFirstAction === 0) {
      return { timeToFirstAction: ms };
    }
    return state;
  }),
  incrementHesitation: () => set((state) => ({ hesitationPauses: state.hesitationPauses + 1 })),
  incrementAnswerFlip: () => set((state) => ({ answerFlips: state.answerFlips + 1 })),
  setModality: (modality) => set({ activeModality: modality }),
  resetTelemetry: () => set({
    timeToFirstAction: 0,
    hesitationPauses: 0,
    answerFlips: 0,
    // Note: modality persists across problems unless explicitly changed
  }),
}));

export const useSessionStore = create<SessionState>((set) => ({
  studentId: null,
  currentProblemId: null,
  currentNodeId: null,

  setSession: (studentId, nodeId) => set({ studentId, currentNodeId: nodeId }),
  setCurrentProblem: (problemId) => set({ currentProblemId: problemId }),
  resetSession: () => set({ studentId: null, currentProblemId: null, currentNodeId: null }),
}));
