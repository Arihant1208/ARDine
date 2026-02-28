import { create } from 'zustand';
import { Dish, OrderItem, PaymentMethod } from '@/shared/types';

type PaymentStep = 'idle' | 'info' | 'paying' | 'done';

interface CartState {
    items: OrderItem[];
    selectedTable: number | null;
    selectedPayment: PaymentMethod;
    customerName: string;
    customerPhone: string;
    paymentStep: PaymentStep;

    addItem: (dish: Dish, quantity?: number) => void;
    removeItem: (dishId: string) => void;
    updateQuantity: (dishId: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
    itemCount: () => number;

    setTable: (table: number) => void;
    setPaymentMethod: (method: PaymentMethod) => void;
    setCustomerName: (name: string) => void;
    setCustomerPhone: (phone: string) => void;
    setPaymentStep: (step: PaymentStep) => void;
    resetCheckout: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    selectedTable: null,
    selectedPayment: 'Cash',
    customerName: '',
    customerPhone: '',
    paymentStep: 'idle',

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

    setTable: (table: number) => set({ selectedTable: table }),
    setPaymentMethod: (method: PaymentMethod) => set({ selectedPayment: method }),
    setCustomerName: (name: string) => set({ customerName: name }),
    setCustomerPhone: (phone: string) => set({ customerPhone: phone }),
    setPaymentStep: (step: PaymentStep) => set({ paymentStep: step }),

    resetCheckout: () => {
        set({
            items: [],
            selectedTable: null,
            selectedPayment: 'Cash',
            customerName: '',
            customerPhone: '',
            paymentStep: 'idle',
        });
    },
}));
