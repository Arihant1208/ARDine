
import { db } from "./dbClient";
import { Dish, Order, RestaurantConfig, UserId } from "../types";

export const MenuRepository = {
  async getAll(userId: UserId): Promise<Dish[]> {
    return await db.queryDishes(userId);
  },
  async save(dish: Dish): Promise<Dish> {
    return await db.insertDish(dish);
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
  }
};
