// import getCurrentUser from '@/app/actions/getCurrentUser';
import { create } from 'zustand';


interface OverdueState {
  overdueState: boolean;
  setOverdueState: (value: boolean) => void;
}

export const useOverdueStore = create<OverdueState>((set) => ({
  overdueState: false, // Initial state for local usage
  setOverdueState: (value: boolean) => set((state) => ({ overdueState: value })),
}));
