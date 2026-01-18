
import { Dish, OrderItem, PaymentMethod, Order, User, UserId, RestaurantConfig } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

const apiUrl = (path: string) => {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, '')}${path}`;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
};

export const ApiService = {
  // Auth
  async login(email: string, pass: string): Promise<User> {
    return await requestJson<User>(`/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, pass }),
    });
  },

  async signUp(email: string, name: string, pass: string): Promise<User> {
    return await requestJson<User>(`/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({ email, name, pass }),
    });
  },

  // Owner specific (Protected by passing currentUserId)
  async analyzeMenuImage(userId: UserId, base64: string): Promise<Dish> {
    return await requestJson<Dish>(`/api/users/${userId}/menu/analyze`, {
      method: 'POST',
      body: JSON.stringify({ base64 }),
    });
  },

  async getMenu(userId: UserId): Promise<Dish[]> {
    return await requestJson<Dish[]>(`/api/users/${userId}/menu`);
  },

  async getConfig(userId: UserId): Promise<RestaurantConfig | null> {
    return await requestJson<RestaurantConfig | null>(`/api/users/${userId}/config`);
  },

  async saveConfig(config: RestaurantConfig): Promise<RestaurantConfig> {
    return await requestJson<RestaurantConfig>(`/api/users/${config.userId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async fetchDashboardOrders(userId: UserId): Promise<Order[]> {
    return await requestJson<Order[]>(`/api/users/${userId}/orders`);
  },

  async updateOrderStatus(userId: UserId, orderId: string, status: Order['status']): Promise<void> {
    await requestJson<{ ok: true }>(`/api/users/${userId}/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Customer specific
  async placeOrder(
    userId: UserId,
    tableNumber: number, 
    items: OrderItem[], 
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    return await requestJson<Order>(`/api/users/${userId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ tableNumber, items, paymentMethod }),
    });
  }
};
