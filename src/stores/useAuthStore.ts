import { create } from 'zustand';
import { User } from '@/shared/types';
import { ApiService, setAuthToken, restoreAuthToken } from '@/shared/services/api';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    loginWithGoogle: (idToken: string) => Promise<void>;
    demoLogin: () => Promise<void>;
    restoreSession: () => boolean;
    logout: () => void;
    clearError: () => void;
}

const USER_STORAGE_KEY = 'ardine_user';

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    loginWithGoogle: async (idToken: string) => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = await ApiService.loginWithGoogle(idToken);
            setAuthToken(token);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            set({ user, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Google login failed',
                isLoading: false
            });
            throw error;
        }
    },

    demoLogin: async () => {
        set({ isLoading: true, error: null });
        try {
            const { user, token } = await ApiService.demoLogin();
            setAuthToken(token);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
            set({ user, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Demo login failed',
                isLoading: false
            });
            throw error;
        }
    },

    /** Restore token + user from localStorage on app startup. Returns true if session restored. */
    restoreSession: () => {
        const token = restoreAuthToken();
        if (!token) return false;

        try {
            const raw = localStorage.getItem(USER_STORAGE_KEY);
            if (!raw) { setAuthToken(null); return false; }
            const user = JSON.parse(raw) as User;
            set({ user });
            return true;
        } catch {
            setAuthToken(null);
            return false;
        }
    },

    logout: () => {
        setAuthToken(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        set({ user: null, error: null });
    },

    clearError: () => {
        set({ error: null });
    },
}));
