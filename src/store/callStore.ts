import { create } from 'zustand';
import { Call } from '@/types';

interface CallState {
  activeCall: Call | null;
  incomingCall: Call | null;
  outgoingCall: Call | null;
  setActiveCall: (call: Call | null) => void;
  setIncomingCall: (call: Call | null) => void;
  setOutgoingCall: (call: Call | null) => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  incomingCall: null,
  outgoingCall: null,
  setActiveCall: (activeCall) => set({ activeCall }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setOutgoingCall: (outgoingCall) => set({ outgoingCall }),
}));
