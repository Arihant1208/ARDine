import express from 'express';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';

import { processMenuUpload, fetchMenu } from './menuController';
import { createNewOrder, getLiveOrders, updateStatus } from './orderController';
import { AuthRepository, ConfigRepository } from '../database/repositories';
import { seedDemoData } from './db/seed';
import type { Order, OrderItem, PaymentMethod, RestaurantConfig, UserId } from '../src/shared/types';

loadEnv({ path: process.env.ENV_FILE ?? '.env.local' });

// Back-compat: existing AI client checks API_KEY
if (!process.env.API_KEY && process.env.GEMINI_API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  })
);
app.use(express.json({ limit: '15mb' }));

// Simple Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, pass } = req.body as { email?: string; pass?: string };
    if (!email || !pass) return res.status(400).json({ error: 'Missing credentials' });

    const user = await AuthRepository.login(email, pass);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, name, pass } = req.body as { email?: string; name?: string; pass?: string };
    if (!email || !name || !pass) return res.status(400).json({ error: 'Missing fields' });

    const user = await AuthRepository.signUp(email, name, pass);
    return res.json(user);
  } catch (_err) {
    return res.status(500).json({ error: 'Signup failed' });
  }
});

// Menu
app.get('/api/users/:userId/menu', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const menu = await fetchMenu(userId);
    return res.json(menu);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.post('/api/users/:userId/menu/analyze', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const { base64 } = req.body as { base64?: string };
    if (!base64) return res.status(400).json({ error: 'Missing image data' });

    const dish = await processMenuUpload(userId, base64);
    return res.json(dish);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze image';
    return res.status(400).json({ error: message });
  }
});

// Config
app.get('/api/users/:userId/config', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const config = await ConfigRepository.get(userId);
    return res.json(config);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.put('/api/users/:userId/config', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const incoming = req.body as RestaurantConfig;
    if (!incoming || incoming.userId !== userId) {
      return res.status(400).json({ error: 'Invalid config payload' });
    }

    const saved = await ConfigRepository.save(incoming);
    return res.json(saved);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to save config' });
  }
});

// Orders
app.get('/api/users/:userId/orders', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const orders = await getLiveOrders(userId);
    return res.json(orders);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/users/:userId/orders', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const { tableNumber, items, paymentMethod } = req.body as {
      tableNumber?: number;
      items?: OrderItem[];
      paymentMethod?: PaymentMethod;
    };

    if (!tableNumber || !items || !paymentMethod) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const order = await createNewOrder(userId, tableNumber, items, paymentMethod);
    return res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to place order';
    return res.status(400).json({ error: message });
  }
});

app.patch('/api/users/:userId/orders/:orderId/status', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const orderId = req.params.orderId;
    const { status } = req.body as { status?: Order['status'] };
    if (!status) return res.status(400).json({ error: 'Missing status' });

    await updateStatus(userId, orderId, status);
    return res.json({ ok: true });
  } catch (_err) {
    return res.status(400).json({ error: 'Failed to update status' });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, async () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on http://localhost:${port}`);

  // Seed demo data if needed
  await seedDemoData();
});
