import { create } from 'zustand';

interface BooaleanState {
  triggeredState: boolean;
  setTriggeredState: (value: boolean) => void;
}

export const useTriggerCopyStore = create<BooaleanState>((set) => ({
  triggeredState: false,
  setTriggeredState: (value: boolean) => set((state) => ({ triggeredState: value })),
}))