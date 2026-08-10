import { create } from 'zustand';
import { Profile } from '@/types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  isAuthLoaded: boolean;
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthLoaded: (loaded: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAuthLoaded: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthLoaded: (isAuthLoaded) => set({ isAuthLoaded }),
  signOut: () => set({ user: null, profile: null, isAuthLoaded: true }),
}));
