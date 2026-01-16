
import { processMenuUpload, fetchMenu } from "../backend/menuController";
import { createNewOrder, getLiveOrders, updateStatus } from "../backend/orderController";
import { ConfigRepository, AuthRepository } from "../database/repositories";
import { Dish, OrderItem, PaymentMethod, Order, User, UserId, RestaurantConfig } from "../types";

export const ApiService = {
  // Auth
  async login(email: string, pass: string): Promise<User> {
    const user = await AuthRepository.login(email, pass);
    if (!user) throw new Error("Invalid credentials");
    return user;
  },

  async signUp(email: string, name: string, pass: string): Promise<User> {
    return await AuthRepository.signUp(email, name, pass);
  },

  // Owner specific (Protected by passing currentUserId)
  async analyzeMenuImage(userId: UserId, base64: string): Promise<Dish> {
    return await processMenuUpload(userId, base64);
  },

  async getMenu(userId: UserId): Promise<Dish[]> {
    return await fetchMenu(userId);
  },

  async getConfig(userId: UserId): Promise<RestaurantConfig | null> {
    return await ConfigRepository.get(userId);
  },

  async saveConfig(config: RestaurantConfig): Promise<RestaurantConfig> {
    return await ConfigRepository.save(config);
  },

  async fetchDashboardOrders(userId: UserId): Promise<Order[]> {
    return await getLiveOrders(userId);
  },

  async updateOrderStatus(userId: UserId, orderId: string, status: Order['status']): Promise<void> {
    return await updateStatus(userId, orderId, status);
  },

  // Customer specific
  async placeOrder(
    userId: UserId,
    tableNumber: number, 
    items: OrderItem[], 
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    return await createNewOrder(userId, tableNumber, items, paymentMethod);
  }
};
