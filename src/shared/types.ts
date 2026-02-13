
export type DishId = string;
export type OrderId = string;
export type UserId = string;

export type ModelGenerationStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface User {
  id: UserId;
  email: string;
  name: string;
  avatar?: string;
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
}

export interface OrderItem {
  dish: Dish;
  quantity: number;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Wallet';
export type PaymentStatus = 'Pending' | 'Paid';
export type OrderStatus = 'received' | 'preparing' | 'served' | 'paid';

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
}

export interface RestaurantConfig {
  userId: UserId;
  name: string;
  tables: number;
}

export type ViewState = 
  | 'landing' 
  | 'auth'
  | 'owner-setup' 
  | 'owner-dashboard' 
  | 'customer-menu' 
  | 'customer-cart';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
