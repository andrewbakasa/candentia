import { StateCreator, create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BooleanState {
  loginlatch: boolean;
  setLatchState: (value: boolean) => void;
}

// const loginLatchSlice: StateCreator<BooleanState> = (set) => ({
//   loginlatch: false,
//   setLatchState: (value: boolean) => set((state) => ({ loginlatch: value })),
// });

// export const useLoginLatchStore = create<BooleanState>()(
//   persist(loginLatchSlice, {
//     name: "loginlatch222",
//   })
// );
export const useLoginLatchStore = create<BooleanState>((set) => ({
  loginlatch: false,
  setLatchState: (value: boolean) => set((state) => ({ loginlatch: value })),
}))