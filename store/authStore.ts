import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;

  initialized: boolean;

  // Actions
  signup: (email: string, password: string, full_name: string, role?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,

  signup: async (email: string, password: string, full_name: string, role: string = 'customer') => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // After signup, log the user in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      set({
        user: data.user,
        session: authData.session,
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      set({
        user: data.profile,
        session: data.session,
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      await supabase.auth.signOut();

      set({
        user: null,
        session: null,
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false, initialized: true });
      throw error;
    }
  },

  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        set({ user: null, session: null, loading: false, initialized: true });
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user');
      }

      set({
        user: data.profile,
        session,
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false, user: null, session: null, initialized: true });
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },
}));
