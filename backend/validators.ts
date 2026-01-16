
import { Dish, OrderItem } from "../types";

export const validateMenuImage = (base64: string): boolean => {
  if (!base64) return false;
  // Basic base64 image validation
  const regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  return regex.test(base64);
};

export const validateDishData = (dish: Partial<Dish>): boolean => {
  if (!dish.name || dish.name.trim().length < 2) return false;
  if (typeof dish.price !== 'number' || dish.price < 0) return false;
  if (!dish.category) return false;
  return true;
};

export const validateOrder = (tableNumber: number, items: OrderItem[]): boolean => {
  if (!tableNumber || tableNumber <= 0) return false;
  if (!items || items.length === 0) return false;
  
  return items.every(item => 
    item.dish && 
    item.dish.id && 
    typeof item.quantity === 'number' && 
    item.quantity > 0
  );
};
