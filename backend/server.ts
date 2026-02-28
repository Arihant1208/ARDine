// env.ts MUST be the very first import — it calls dotenv before any
// other module reads process.env at import time (e.g. dbClient.ts).
import './env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';

import { processMenuUpload, fetchMenu, deleteDish } from './menuController';
import { createNewOrder, createOrderPaymentIntent, confirmOrderPayment, getLiveOrders, updateStatus, handleStripeWebhook } from './orderController';
import { AuthRepository, ConfigRepository } from '../database/repositories';
import { seedDemoData } from './db/seed';
import { pingClamAV } from './scannerClient';
import { bucketExists, BUCKET_IMAGES, BUCKET_MODELS } from './storageClient';
import { signToken, requireAuth } from './authMiddleware';
import type { OrderItem, PaymentMethod, RestaurantConfig, UserId, OrderStatus } from '../src/shared/types';

const app = express();

// ── Stripe webhook route (must be BEFORE express.json() to get raw body) ──
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  })
);
app.use(express.json({ limit: '15mb' }));

// Security headers (platform-agnostic)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://accounts.google.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*"],
      connectSrc: ["'self'", "https://*"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for model-viewer
}));

// Rate limiting — AI analysis endpoint gets stricter limits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 AI analysis requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI analysis rate limit exceeded' },
});

app.use('/api/', generalLimiter);

// Simple Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get('/api/health', async (_req, res) => {
  const checks = {
    api: true,
    clamav: await pingClamAV().catch(() => false),
    storage: await bucketExists(BUCKET_IMAGES).catch(() => false),
  };
  const healthy = Object.values(checks).every(Boolean);
  res.status(healthy ? 200 : 503).json({ ok: healthy, checks });
});

// ── Auth ──────────────────────────────────────────────────────────────────

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const user = await AuthRepository.loginWithGoogle(
      payload.sub,
      payload.email,
      payload.name ?? payload.email.split('@')[0],
    );

    const token = signToken({ userId: user.id, email: user.email });
    return res.json({ user, token });
  } catch (err) {
    console.error('[Auth] Google login failed:', err);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

// Demo login (development convenience — no real auth for demo user)
app.post('/api/auth/demo', async (_req, res) => {
  try {
    const user = await AuthRepository.findByEmail('demo@ardine.com');
    if (!user) return res.status(404).json({ error: 'Demo user not found. Run seed first.' });

    const token = signToken({ userId: user.id, email: user.email });
    return res.json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: 'Demo login failed' });
  }
});

// ── Stripe config (publishable key for frontend) ───────────────────────────

app.get('/api/config/stripe', (_req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  return res.json({ publishableKey });
});

// ── Menu (customer-facing: no auth; owner mutations: auth required) ────────

app.get('/api/users/:userId/menu', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const menu = await fetchMenu(userId);
    return res.json(menu);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.post('/api/users/:userId/menu/analyze', requireAuth, aiLimiter, async (req, res) => {
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

app.delete('/api/users/:userId/menu/:dishId', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const dishId = req.params.dishId;
    await deleteDish(userId, dishId);
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete dish';
    return res.status(400).json({ error: message });
  }
});

// ── Config (owner-only: auth required) ─────────────────────────────────────

app.get('/api/users/:userId/config', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const config = await ConfigRepository.get(userId);
    return res.json(config);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch config' });
  }
});

app.put('/api/users/:userId/config', requireAuth, async (req, res) => {
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

// ── Orders ─────────────────────────────────────────────────────────────────

// Customer-facing: list orders for a restaurant (for owner dashboard, auth required)
app.get('/api/users/:userId/orders', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const orders = await getLiveOrders(userId);
    return res.json(orders);
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Customer places a Cash order (no Stripe, no auth)
app.post('/api/users/:userId/orders', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const { tableNumber, items, paymentMethod, customerName, customerPhone } = req.body as {
      tableNumber?: number;
      items?: OrderItem[];
      paymentMethod?: PaymentMethod;
      customerName?: string;
      customerPhone?: string;
    };

    if (!tableNumber || !items || !paymentMethod || !customerName || !customerPhone) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const order = await createNewOrder(userId, tableNumber, items, paymentMethod, customerName, customerPhone);
    return res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to place order';
    return res.status(400).json({ error: message });
  }
});

// Customer creates a Stripe PaymentIntent (no auth — customer-facing)
app.post('/api/users/:userId/orders/create-payment-intent', async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const { tableNumber, items, paymentMethod, customerName, customerPhone } = req.body as {
      tableNumber?: number;
      items?: OrderItem[];
      paymentMethod?: PaymentMethod;
      customerName?: string;
      customerPhone?: string;
    };

    if (!tableNumber || !items || !paymentMethod || !customerName || !customerPhone) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const result = await createOrderPaymentIntent(userId, tableNumber, items, paymentMethod, customerName, customerPhone);
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create payment intent';
    return res.status(400).json({ error: message });
  }
});

// Customer confirms payment after Stripe checkout (no auth — customer-facing)
app.post('/api/users/:userId/orders/:orderId/confirm-payment', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { paymentIntentId } = req.body as { paymentIntentId?: string };
    if (!paymentIntentId) return res.status(400).json({ error: 'Missing paymentIntentId' });

    await confirmOrderPayment(orderId, paymentIntentId);
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return res.status(400).json({ error: message });
  }
});

// Owner updates order status (auth required)
app.patch('/api/users/:userId/orders/:orderId/status', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId as UserId;
    const orderId = req.params.orderId;
    const { status } = req.body as { status?: OrderStatus };
    if (!status) return res.status(400).json({ error: 'Missing status' });

    await updateStatus(userId, orderId, status);
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update status';
    return res.status(400).json({ error: message });
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, async () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on http://localhost:${port}`);

  // Seed demo data if needed
  await seedDemoData();
});
