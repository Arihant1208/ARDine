
import { Order, OrderItem, PaymentMethod, UserId, OrderStatus } from "../src/shared/types";
import { validateOrder, validateCustomerInfo, validateStatusTransition } from "./validators";
import { OrderRepository } from "../database/repositories";
import { createPaymentIntent, retrievePaymentIntent, constructWebhookEvent } from "./stripeClient";
import type { Request, Response } from "express";

export const createNewOrder = async (
  userId: UserId,
  tableNumber: number,
  items: OrderItem[],
  paymentMethod: PaymentMethod,
  customerName: string,
  customerPhone: string,
): Promise<Order> => {
  if (!validateOrder(tableNumber, items)) {
    throw new Error("Order validation failed");
  }

  const customerError = validateCustomerInfo(customerName, customerPhone);
  if (customerError) {
    throw new Error(customerError);
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
    paymentStatus: paymentMethod === 'Cash' ? 'Pending' : 'Pending', // All start Pending; Stripe webhook/verify sets Paid
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
  };

  return await OrderRepository.save(order);
};

/** Create a Stripe PaymentIntent for a pending order. */
export const createOrderPaymentIntent = async (
  userId: UserId,
  tableNumber: number,
  items: OrderItem[],
  paymentMethod: PaymentMethod,
  customerName: string,
  customerPhone: string,
): Promise<{ clientSecret: string; paymentIntentId: string; orderId: string }> => {
  // Create the order first (status: Pending)
  const order = await createNewOrder(userId, tableNumber, items, paymentMethod, customerName, customerPhone);

  // Create Stripe PaymentIntent
  const amountInCents = Math.round(order.total * 100);
  const { clientSecret, paymentIntentId } = await createPaymentIntent({
    amountInCents,
    metadata: {
      orderId: order.id,
      userId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableNumber: String(tableNumber),
    },
  });

  // Store the Stripe PI ID on the order
  await OrderRepository.updatePayment(order.id, 'Pending', paymentIntentId);

  return { clientSecret, paymentIntentId, orderId: order.id };
};

/** Client-side payment confirmation: verify the PaymentIntent succeeded. */
export const confirmOrderPayment = async (
  orderId: string,
  paymentIntentId: string,
): Promise<void> => {
  const intent = await retrievePaymentIntent(paymentIntentId);

  if (intent.status !== 'succeeded') {
    throw new Error(`Payment not completed. Status: ${intent.status}`);
  }

  // Verify the orderId in metadata matches
  if (intent.metadata.orderId !== orderId) {
    throw new Error('Payment metadata does not match order');
  }

  await OrderRepository.updatePayment(orderId, 'Paid', paymentIntentId);
};

/** Stripe webhook handler factory. */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    const event = constructWebhookEvent(req.body as Buffer, sig);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        if (pi.metadata.orderId) {
          await OrderRepository.updatePayment(pi.metadata.orderId, 'Paid', pi.id);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        if (pi.metadata.orderId) {
          await OrderRepository.updatePayment(pi.metadata.orderId, 'Failed', pi.id);
        }
        break;
      }
      default:
        // Unhandled event type — ignore
        break;
    }

    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    console.error('[Stripe Webhook]', message);
    res.status(400).json({ error: message });
  }
};

export const getLiveOrders = async (userId: UserId): Promise<Order[]> => {
  return await OrderRepository.getAll(userId);
};

export const updateStatus = async (userId: UserId, id: string, status: OrderStatus): Promise<void> => {
  // Enforce state machine
  const currentStatus = await OrderRepository.getStatus(id);
  if (!currentStatus) throw new Error('Order not found');

  if (!validateStatusTransition(currentStatus, status)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${status}`);
  }

  return await OrderRepository.updateStatus(userId, id, status);
};
