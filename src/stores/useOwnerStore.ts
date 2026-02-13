import { create } from 'zustand';
import { Dish, Order, RestaurantConfig, UserId } from '@/shared/types';
import { ApiService } from '@/shared/services/api';

interface OwnerState {
    menu: Dish[];
    orders: Order[];
    config: RestaurantConfig | null;
    isLoading: boolean;
    error: string | null;

    // Menu actions
    loadMenu: (userId: UserId) => Promise<void>;
    addDish: (dish: Dish) => void;

    // Order actions
    loadOrders: (userId: UserId) => Promise<void>;
    updateOrderStatus: (userId: UserId, orderId: string, status: Order['status']) => Promise<void>;

    // Config actions
    loadConfig: (userId: UserId) => Promise<void>;
    updateConfig: (config: RestaurantConfig) => Promise<void>;

    clearError: () => void;
}

export const useOwnerStore = create<OwnerState>((set, get) => ({
    menu: [],
    orders: [],
    config: null,
    isLoading: false,
    error: null,

    loadMenu: async (userId: UserId) => {
        set({ isLoading: true, error: null });
        try {
            const menu = await ApiService.getMenu(userId);
            set({ menu, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load menu',
                isLoading: false
            });
        }
    },

    addDish: (dish: Dish) => {
        set((state) => ({
            menu: [...state.menu, dish],
        }));
    },

    loadOrders: async (userId: UserId) => {
        set({ isLoading: true, error: null });
        try {
            const orders = await ApiService.fetchDashboardOrders(userId);
            set({ orders, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load orders',
                isLoading: false
            });
        }
    },

    updateOrderStatus: async (userId: UserId, orderId: string, status: Order['status']) => {
        try {
            await ApiService.updateOrderStatus(userId, orderId, status);
            // Reload orders after update
            await get().loadOrders(userId);
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update order status'
            });
        }
    },

    loadConfig: async (userId: UserId) => {
        set({ isLoading: true, error: null });
        try {
            const config = await ApiService.getConfig(userId);
            set({ config, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load config',
                isLoading: false
            });
        }
    },

    updateConfig: async (config: RestaurantConfig) => {
        set({ isLoading: true, error: null });
        try {
            const updatedConfig = await ApiService.saveConfig(config);
            set({ config: updatedConfig, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update config',
                isLoading: false
            });
        }
    },

    clearError: () => {
        set({ error: null });
    },
}));
