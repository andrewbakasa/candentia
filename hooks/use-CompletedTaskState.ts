import { create } from 'zustand';

interface BooaleanState {
  completedTasks: boolean;
  setCompletedTaskState: (value: boolean) => void;
}

export const useCompletedTaskStore = create<BooaleanState>((set) => ({
  completedTasks: false,
  setCompletedTaskState: (value: boolean) => set((state) => ({ completedTasks: value })),
}))