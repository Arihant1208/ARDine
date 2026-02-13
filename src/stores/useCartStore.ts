import { create } from 'zustand';
import { Dish, OrderItem } from '@/shared/types';

interface CartState {
    items: OrderItem[];
    addItem: (dish: Dish, quantity?: number) => void;
    removeItem: (dishId: string) => void;
    updateQuantity: (dishId: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
    itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (dish: Dish, quantity = 1) => {
        set((state) => {
            const existingItem = state.items.find((item) => item.dish.id === dish.id);

            if (existingItem) {
                return {
                    items: state.items.map((item) =>
                        item.dish.id === dish.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    ),
                };
            }

            return {
                items: [...state.items, { dish, quantity }],
            };
        });
    },

    removeItem: (dishId: string) => {
        set((state) => ({
            items: state.items.filter((item) => item.dish.id !== dishId),
        }));
    },

    updateQuantity: (dishId: string, quantity: number) => {
        if (quantity <= 0) {
            get().removeItem(dishId);
            return;
        }

        set((state) => ({
            items: state.items.map((item) =>
                item.dish.id === dishId ? { ...item, quantity } : item
            ),
        }));
    },

    clearCart: () => {
        set({ items: [] });
    },

    total: () => {
        return get().items.reduce(
            (sum, item) => sum + item.dish.price * item.quantity,
            0
        );
    },

    itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },
}));
