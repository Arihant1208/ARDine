import { create } from 'zustand';
import { User } from '@/shared/types';
import { ApiService } from '@/shared/services/api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, name: string, password: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const user = await ApiService.login(email, password);
            set({ user, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    signUp: async (email: string, name: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const user = await ApiService.signUp(email, name, password);
            set({ user, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Sign up failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: () => {
        set({ user: null, error: null });
    },

    clearError: () => {
        set({ error: null });
    },
}));
