
import { create} from 'zustand';



interface OrderedState {
  // readMode: boolean;
  cardsOrdered: boolean; // Use null as initial state
  setCardsOrderedState: (value: boolean) => void;
}

export const useCardsOrderedStore = create<OrderedState>((set) => ({
  cardsOrdered: false, // Initial state for local usage
  setCardsOrderedState: (value: boolean) => set((state) => ({ cardsOrdered: value })),
 
}));