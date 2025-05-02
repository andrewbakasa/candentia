// 'use server'
import { SafeUser } from "@/app/types";
import { getSession } from "next-auth/react";

import { create } from 'zustand';
import prisma from "@/app/libs/prismadb";
import { useAction } from "./use-action";
import { getCurrUser } from "@/actions/getcurrent-user";
import { toast } from "sonner";
// import getCurrentUser from "@/app/actions/getCurrentUser";

interface BooaleanState {
  currentUserA: string,
  isLoadingCurrentUser: boolean,
  fetchCurrentUser():void
}

export const useCurrentUserStore = create<BooaleanState>((set) => ({

  currentUserA: '',
  isLoadingCurrentUser: false,
  fetchCurrentUser: async () => {
    set((state)=>({ isLoadingCurrentUser: true })); // Set loading state to true
    try {
      const session = await getSession(); // Assuming you have getSession() defined
      console.log('session:', session)
      toast.message('getting session data...')
      toast.message(session?.user.email)
      if (!session?.user?.email) {
        set({ currentUserA: '', isLoadingCurrentUser: false });
        return;
      }
      
    // if (!session?.user?.email) {
    //     return null;
    //   }
      console.log('cA',session?.user?.email)
      set((state)=>({ currentUserA:session?.user?.email ||'', isLoadingCurrentUser: false })); // Update state
    } catch (error) {
      console.error('Error fetching currentUser:', error);
      set({ isLoadingCurrentUser: false }); // Reset loading state on error
    }
  },
}))


