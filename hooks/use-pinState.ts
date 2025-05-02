

import { create } from 'zustand';

interface PinState {
  pinState: boolean | null;
  setPinState: (value: boolean | null) => void;
}

export const usePinStateStore = create<PinState>((set) => ({
  pinState: null, // Initial state for local usage
  setPinState: (value: boolean | null) => set((state) => ({ pinState: value })),
}));