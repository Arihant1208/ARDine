
import { db } from "./dbClient";
import { Dish, Order, RestaurantConfig, UserId, User } from "../src/shared/types";

export const MenuRepository = {
  async getAll(userId: UserId): Promise<Dish[]> {
    return await db.queryDishes(userId);
  },
  async save(dish: Dish): Promise<Dish> {
    return await db.insertDish(dish);
  },
  async updateDishStatus(userId: UserId, dishId: string, updates: Partial<Dish>): Promise<void> {
    return await db.updateDishStatus(userId, dishId, updates);
  },
  async delete(userId: UserId, dishId: string): Promise<{ images: string[]; arModelUrl?: string }> {
    return await db.deleteDish(userId, dishId);
  }
};

export const OrderRepository = {
  async getAll(userId: UserId): Promise<Order[]> {
    return await db.queryOrders(userId);
  },
  async save(order: Order): Promise<Order> {
    return await db.insertOrder(order);
  },
  async updateStatus(userId: UserId, orderId: string, status: Order['status']): Promise<void> {
    return await db.updateOrderStatus(userId, orderId, status);
  },
  async getStatus(orderId: string): Promise<Order['status'] | null> {
    return await db.getOrderStatus(orderId);
  },
  async updatePayment(orderId: string, paymentStatus: Order['paymentStatus'], stripePaymentIntentId?: string): Promise<void> {
    return await db.updateOrderPayment(orderId, paymentStatus, stripePaymentIntentId);
  },
  async updatePaymentByIntentId(stripePaymentIntentId: string, paymentStatus: Order['paymentStatus']): Promise<void> {
    return await db.updateOrderPaymentByIntentId(stripePaymentIntentId, paymentStatus);
  }
};

export const ConfigRepository = {
  async get(userId: UserId): Promise<RestaurantConfig | null> {
    return await db.getConfig(userId);
  },
  async save(config: RestaurantConfig): Promise<RestaurantConfig> {
    return await db.saveConfig(config);
  }
};

export const AuthRepository = {
  async signUp(email: string, name: string, pass: string) {
    return await db.createUser(email, name, pass);
  },
  async login(email: string, pass: string) {
    return await db.validateUser(email, pass);
  },
  async loginWithGoogle(googleId: string, email: string, name: string): Promise<User> {
    return await db.findOrCreateByGoogle(googleId, email, name);
  },
  async findByEmail(email: string): Promise<User | null> {
    return await db.findByEmail(email);
  }
};
