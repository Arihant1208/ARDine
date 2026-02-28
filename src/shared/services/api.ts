
import { Dish, OrderItem, PaymentMethod, Order, User, UserId, RestaurantConfig, OrderStatus } from "@/shared/types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

const apiUrl = (path: string) => {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, '')}${path}`;
};

// ── Token management ─────────────────────────────────────────────────────

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('ardine_token', token);
  } else {
    localStorage.removeItem('ardine_token');
  }
};

export const restoreAuthToken = () => {
  authToken = localStorage.getItem('ardine_token');
  return authToken;
};

// ── Request helper ────────────────────────────────────────────────────────

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
};

// ── Stripe config ─────────────────────────────────────────────────────────

interface StripeConfig {
  publishableKey: string;
}

interface PaymentIntentResult {
  order: Order;
  clientSecret: string;
}

export const ApiService = {
  // Auth
  async loginWithGoogle(idToken: string): Promise<{ user: User; token: string }> {
    return await requestJson<{ user: User; token: string }>(`/api/auth/google`, {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  async demoLogin(): Promise<{ user: User; token: string }> {
    return await requestJson<{ user: User; token: string }>(`/api/auth/demo`, {
      method: 'POST',
    });
  },

  // Stripe config
  async getStripeConfig(): Promise<StripeConfig> {
    return await requestJson<StripeConfig>(`/api/config/stripe`);
  },

  // Owner specific (Protected — auth token auto-attached)
  async analyzeMenuImage(userId: UserId, base64: string): Promise<Dish> {
    return await requestJson<Dish>(`/api/users/${userId}/menu/analyze`, {
      method: 'POST',
      body: JSON.stringify({ base64 }),
    });
  },

  async deleteDish(userId: UserId, dishId: string): Promise<void> {
    await requestJson<{ ok: true }>(`/api/users/${userId}/menu/${encodeURIComponent(dishId)}`, {
      method: 'DELETE',
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

  async updateOrderStatus(userId: UserId, orderId: string, status: OrderStatus): Promise<void> {
    await requestJson<{ ok: true }>(`/api/users/${userId}/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Customer specific (no auth required)
  async placeOrder(
    userId: UserId,
    tableNumber: number,
    items: OrderItem[],
    paymentMethod: PaymentMethod,
    customerName: string,
    customerPhone: string,
  ): Promise<Order> {
    return await requestJson<Order>(`/api/users/${userId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ tableNumber, items, paymentMethod, customerName, customerPhone }),
    });
  },

  async createPaymentIntent(
    userId: UserId,
    tableNumber: number,
    items: OrderItem[],
    paymentMethod: PaymentMethod,
    customerName: string,
    customerPhone: string,
  ): Promise<PaymentIntentResult> {
    return await requestJson<PaymentIntentResult>(`/api/users/${userId}/orders/create-payment-intent`, {
      method: 'POST',
      body: JSON.stringify({ tableNumber, items, paymentMethod, customerName, customerPhone }),
    });
  },

  async confirmPayment(userId: UserId, orderId: string, paymentIntentId: string): Promise<void> {
    await requestJson<{ ok: true }>(`/api/users/${userId}/orders/${encodeURIComponent(orderId)}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  },
};
