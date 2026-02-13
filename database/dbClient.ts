
import { Dish, Order, User, RestaurantConfig, UserId } from "../src/shared/types";

class PostgresClient {
  private static instance: PostgresClient;

  private users: Map<string, User> = new Map();
  private credentials: Map<string, string> = new Map();
  private dishes: Map<UserId, Map<string, Dish>> = new Map();
  private orders: Map<UserId, Map<string, Order>> = new Map();
  private configs: Map<UserId, RestaurantConfig> = new Map();

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  private seedDemoData() {
    const demoUsers: User[] = [
      { id: 'u_demo', email: 'demo@ardine.com', name: 'Gourmet Garden' },
      { id: 'g_123', email: 'google@user.com', name: 'Demo Gourmet' }
    ];

    demoUsers.forEach(user => {
      this.users.set(user.id, user);
      this.credentials.set(user.email, 'password123');

      this.configs.set(user.id, {
        userId: user.id,
        name: user.id === 'u_demo' ? "Gourmet Garden AR" : "Bistro Digitale",
        tables: 12
      });

      const userDishes = new Map<string, Dish>();
      const dishes: Dish[] = [
        {
          id: `d1_${user.id}`,
          userId: user.id,
          name: "Truffle Mushroom Pizza",
          description: "Artisanal sourdough topped with wild truffles, creamy mozzarella, and fresh arugula.",
          price: 18.99,
          category: "Mains",
          images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80"],
          portionSize: "12 inch",
          isARReady: true,
          arModelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
          modelGenerationStatus: 'ready',
          generationProgress: 100
        },
        {
          id: `d2_${user.id}`,
          userId: user.id,
          name: "Wagyu Secret Burger",
          description: "Premium A5 Wagyu beef, caramelized onions, melted aged cheddar, and house-made truffle aioli.",
          price: 24.50,
          category: "Burgers",
          images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"],
          portionSize: "Regular",
          isARReady: true,
          arModelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
          modelGenerationStatus: 'ready',
          generationProgress: 100
        },
        {
          id: `d3_${user.id}`,
          userId: user.id,
          name: "Miso Glazed Salmon",
          description: "Atlantic salmon fillet glazed with honey-miso, served over a bed of roasted asparagus.",
          price: 21.00,
          category: "Seafood",
          images: ["https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80"],
          portionSize: "250g",
          isARReady: false,
          modelGenerationStatus: 'generating',
          generationProgress: 45
        }
      ];

      dishes.forEach(d => userDishes.set(d.id, d));
      this.dishes.set(user.id, userDishes);

      const userOrders = new Map<string, Order>();
      const order1: Order = {
        id: "#ORD-7721",
        userId: user.id,
        tableNumber: 4,
        items: [{ dish: dishes[0], quantity: 1 }, { dish: dishes[1], quantity: 1 }],
        status: 'preparing',
        total: 45.66,
        timestamp: Date.now() - 600000,
        paymentMethod: 'Card',
        paymentStatus: 'Paid'
      };
      userOrders.set(order1.id, order1);
      this.orders.set(user.id, userOrders);
    });
  }

  async queryDishes(userId: UserId): Promise<Dish[]> {
    const userDishes = this.dishes.get(userId);
    return userDishes ? Array.from(userDishes.values()) : [];
  }

  async insertDish(dish: Dish): Promise<Dish> {
    if (!this.dishes.has(dish.userId)) this.dishes.set(dish.userId, new Map());
    this.dishes.get(dish.userId)!.set(dish.id, dish);
    return dish;
  }

  async updateDishStatus(userId: UserId, dishId: string, updates: Partial<Dish>): Promise<void> {
    const dish = this.dishes.get(userId)?.get(dishId);
    if (dish) {
      Object.assign(dish, updates);
    }
  }

  async createUser(email: string, name: string, pass: string): Promise<User> {
    const user: User = { id: `u_${Date.now()}`, email, name };
    this.users.set(user.id, user);
    this.credentials.set(email, pass);
    return user;
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const storedPass = this.credentials.get(email);
    if (storedPass === pass) {
      return Array.from(this.users.values()).find(u => u.email === email) || null;
    }
    return null;
  }

  async queryOrders(userId: UserId): Promise<Order[]> {
    const userOrders = this.orders.get(userId);
    return userOrders ? Array.from(userOrders.values()).sort((a, b) => b.timestamp - a.timestamp) : [];
  }

  async insertOrder(order: Order): Promise<Order> {
    if (!this.orders.has(order.userId)) this.orders.set(order.userId, new Map());
    this.orders.get(order.userId)!.set(order.id, order);
    return order;
  }

  async updateOrderStatus(userId: UserId, orderId: string, status: Order['status']): Promise<void> {
    const order = this.orders.get(userId)?.get(orderId);
    if (order) order.status = status;
  }

  async saveConfig(config: RestaurantConfig): Promise<RestaurantConfig> {
    this.configs.set(config.userId, config);
    return config;
  }

  async getConfig(userId: UserId): Promise<RestaurantConfig | null> {
    return this.configs.get(userId) || null;
  }
}

export const db = PostgresClient.getInstance();
