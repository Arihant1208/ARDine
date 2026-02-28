
export type DishId = string;
export type OrderId = string;
export type UserId = string;

export type ModelGenerationStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface User {
  id: UserId;
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
}

export interface Dish {
  id: DishId;
  userId: UserId;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  portionSize: string;
  isARReady: boolean;
  arModelUrl?: string;
  modelGenerationStatus: ModelGenerationStatus;
  generationProgress: number; // 0 to 100
  geometricPrompt?: string;
}

export interface OrderItem {
  dish: Dish;
  quantity: number;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Cash';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';

/** Allowed order status transitions (state-machine). */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: [],
};

export interface Order {
  id: OrderId;
  userId: UserId;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  timestamp: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  stripePaymentIntentId?: string;
}

export interface RestaurantConfig {
  userId: UserId;
  name: string;
  tables: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthTokenPayload {
  userId: UserId;
  email: string;
}
