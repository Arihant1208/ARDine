
import { Dish, OrderItem } from "../src/shared/types";

/** Maximum image size: 5 MB (after base64 decoding). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Known magic bytes for allowed image formats.
 * Validates actual file content, not just the data-URI prefix.
 */
const MAGIC_BYTES: Record<string, number[]> = {
  png:  [0x89, 0x50, 0x4E, 0x47], // \x89PNG
  jpeg: [0xFF, 0xD8, 0xFF],        // JFIF/EXIF start
  webp: [0x52, 0x49, 0x46, 0x46],  // RIFF (WebP container)
};

const matchesMagicBytes = (buffer: Buffer, expected: number[]): boolean =>
  expected.every((byte, i) => buffer[i] === byte);

export const validateMenuImage = (base64: string): boolean => {
  if (!base64) return false;

  // Step 1: Check data-URI prefix format
  const regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  const match = base64.match(regex);
  if (!match) return false;

  // Step 2: Decode and check byte size
  const rawData = base64.split(',')[1];
  if (!rawData) return false;

  const buffer = Buffer.from(rawData, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) return false;
  if (buffer.length < 8) return false; // Too small to be a valid image

  // Step 3: Verify magic bytes match the declared MIME type
  const declaredType = match[1] === 'jpg' ? 'jpeg' : match[1];
  const expected = MAGIC_BYTES[declaredType];
  if (!expected) return false;

  return matchesMagicBytes(buffer, expected);
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
