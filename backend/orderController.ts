
import { Order, OrderItem, PaymentMethod, UserId } from "../types";
import { validateOrder } from "./validators";
import { OrderRepository } from "../database/repositories";

export const createNewOrder = async (
  userId: UserId,
  tableNumber: number, 
  items: OrderItem[], 
  paymentMethod: PaymentMethod
): Promise<Order> => {
  if (!validateOrder(tableNumber, items)) {
    throw new Error("Order validation failed");
  }

  const subtotal = items.reduce((acc, item) => acc + (item.dish.price * item.quantity), 0);
  const total = subtotal * 1.05;

  const order: Order = {
    id: `#ORD-${Math.floor(1000 + Math.random() * 8999)}`,
    userId,
    tableNumber,
    items,
    status: 'received',
    total,
    timestamp: Date.now(),
    paymentMethod,
    paymentStatus: paymentMethod === 'Cash' ? 'Pending' : 'Paid'
  };

  return await OrderRepository.save(order);
};

export const getLiveOrders = async (userId: UserId): Promise<Order[]> => {
  return await OrderRepository.getAll(userId);
};

export const updateStatus = async (userId: UserId, id: string, status: Order['status']): Promise<void> => {
  return await OrderRepository.updateStatus(userId, id, status);
};
