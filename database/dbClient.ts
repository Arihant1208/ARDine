/**
 * Database client — real PostgreSQL via `pg` Pool.
 *
 * Platform-agnostic: connects to any Postgres-compatible database.
 *  - Local:   postgres:16-alpine container
 *  - Azure:   Azure Database for PostgreSQL
 *  - AWS:     Amazon RDS / Aurora PostgreSQL
 *  - GCP:     Cloud SQL for PostgreSQL
 *
 * Connection is configured via DATABASE_URL env var.
 * All queries use parameterized statements to prevent SQL injection.
 */

import pg from 'pg';
import { Dish, Order, User, RestaurantConfig, UserId } from "../src/shared/types";

const { Pool } = pg;

class PostgresClient {
  private static instance: PostgresClient;
  private pool: pg.Pool;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  public static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  /** Expose pool for health checks / graceful shutdown. */
  public getPool(): pg.Pool {
    return this.pool;
  }

  // ── Dishes ─────────────────────────────────────────────────────────────

  async queryDishes(userId: UserId): Promise<Dish[]> {
    const { rows } = await this.pool.query(
      `SELECT id, user_id, name, description, price, category, images,
              portion_size, is_ar_ready, ar_model_url,
              model_generation_status, generation_progress, geometric_prompt
       FROM dishes WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map(this.rowToDish);
  }

  async insertDish(dish: Dish): Promise<Dish> {
    const { rows } = await this.pool.query(
      `INSERT INTO dishes (id, user_id, name, description, price, category, images,
                           portion_size, is_ar_ready, ar_model_url,
                           model_generation_status, generation_progress, geometric_prompt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        dish.id, dish.userId, dish.name, dish.description,
        dish.price, dish.category, dish.images,
        dish.portionSize, dish.isARReady, dish.arModelUrl ?? null,
        dish.modelGenerationStatus, dish.generationProgress,
        dish.geometricPrompt ?? null,
      ]
    );
    return this.rowToDish(rows[0]);
  }

  async deleteDish(userId: UserId, dishId: string): Promise<{ images: string[]; arModelUrl?: string }> {
    const { rows } = await this.pool.query(
      `DELETE FROM dishes WHERE id = $1 AND user_id = $2 RETURNING images, ar_model_url`,
      [dishId, userId]
    );
    if (rows.length === 0) throw new Error('Dish not found');
    return { images: rows[0].images ?? [], arModelUrl: rows[0].ar_model_url ?? undefined };
  }

  async updateDishStatus(userId: UserId, dishId: string, updates: Partial<Dish>): Promise<void> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.generationProgress !== undefined) {
      setClauses.push(`generation_progress = $${idx++}`);
      values.push(updates.generationProgress);
    }
    if (updates.modelGenerationStatus !== undefined) {
      setClauses.push(`model_generation_status = $${idx++}`);
      values.push(updates.modelGenerationStatus);
    }
    if (updates.isARReady !== undefined) {
      setClauses.push(`is_ar_ready = $${idx++}`);
      values.push(updates.isARReady);
    }
    if (updates.arModelUrl !== undefined) {
      setClauses.push(`ar_model_url = $${idx++}`);
      values.push(updates.arModelUrl);
    }
    if (updates.images !== undefined) {
      setClauses.push(`images = $${idx++}`);
      values.push(updates.images);
    }

    if (setClauses.length === 0) return;

    setClauses.push(`updated_at = NOW()`);
    values.push(userId, dishId);

    await this.pool.query(
      `UPDATE dishes SET ${setClauses.join(', ')}
       WHERE user_id = $${idx++} AND id = $${idx}`,
      values
    );
  }

  // ── Users / Auth ───────────────────────────────────────────────────────

  async createUser(email: string, name: string, pass: string): Promise<User> {
    const id = `u_${Date.now()}`;
    const { rows } = await this.pool.query(
      `INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)
       RETURNING id, email, name`,
      [id, email, name, pass]
    );
    return { id: rows[0].id, email: rows[0].email, name: rows[0].name };
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      `SELECT id, email, name FROM users WHERE email = $1 AND password_hash = $2`,
      [email, pass]
    );
    return rows.length > 0 ? { id: rows[0].id, email: rows[0].email, name: rows[0].name } : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      `SELECT id, email, name, google_id FROM users WHERE google_id = $1`,
      [googleId]
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id, email: rows[0].email, name: rows[0].name, googleId: rows[0].google_id };
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      `SELECT id, email, name, google_id FROM users WHERE email = $1`,
      [email]
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id, email: rows[0].email, name: rows[0].name, googleId: rows[0].google_id ?? undefined };
  }

  async findOrCreateByGoogle(googleId: string, email: string, name: string): Promise<User> {
    // First try by google_id
    const existing = await this.findByGoogleId(googleId);
    if (existing) return existing;

    // Then try by email (link existing account to google)
    const byEmail = await this.findByEmail(email);
    if (byEmail) {
      await this.pool.query(
        `UPDATE users SET google_id = $1 WHERE id = $2`,
        [googleId, byEmail.id]
      );
      return { ...byEmail, googleId };
    }

    // Create new user
    const id = `u_${Date.now()}`;
    const { rows } = await this.pool.query(
      `INSERT INTO users (id, email, name, google_id) VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, google_id`,
      [id, email, name, googleId]
    );
    return { id: rows[0].id, email: rows[0].email, name: rows[0].name, googleId: rows[0].google_id };
  }

  // ── Orders ─────────────────────────────────────────────────────────────

  async queryOrders(userId: UserId): Promise<Order[]> {
    const { rows: orderRows } = await this.pool.query(
      `SELECT id, user_id, table_number, status, total,
              payment_method, payment_status, customer_name, customer_phone,
              stripe_payment_intent_id, created_at
       FROM orders WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const orders: Order[] = [];
    for (const row of orderRows) {
      const { rows: itemRows } = await this.pool.query(
        `SELECT oi.quantity, oi.price_at_order, d.*
         FROM order_items oi
         JOIN dishes d ON oi.dish_id = d.id
         WHERE oi.order_id = $1`,
        [row.id]
      );

      orders.push({
        id: row.id,
        userId: row.user_id,
        tableNumber: row.table_number,
        status: row.status,
        total: parseFloat(row.total),
        timestamp: new Date(row.created_at).getTime(),
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
        items: itemRows.map((ir) => ({
          dish: this.rowToDish(ir),
          quantity: ir.quantity,
        })),
      });
    }
    return orders;
  }

  async insertOrder(order: Order): Promise<Order> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders (id, user_id, table_number, status, total, payment_method, payment_status, customer_name, customer_phone, stripe_payment_intent_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [order.id, order.userId, order.tableNumber, order.status, order.total, order.paymentMethod, order.paymentStatus, order.customerName, order.customerPhone, order.stripePaymentIntentId ?? null]
      );

      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, dish_id, quantity, price_at_order)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.dish.id, item.quantity, item.dish.price]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateOrderStatus(userId: UserId, orderId: string, status: Order['status']): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 AND user_id = $3`,
      [status, orderId, userId]
    );
  }

  async getOrderStatus(orderId: string): Promise<Order['status'] | null> {
    const { rows } = await this.pool.query(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId]
    );
    return rows.length > 0 ? rows[0].status : null;
  }

  async updateOrderPayment(orderId: string, paymentStatus: Order['paymentStatus'], stripePaymentIntentId?: string): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET payment_status = $1, stripe_payment_intent_id = COALESCE($2, stripe_payment_intent_id) WHERE id = $3`,
      [paymentStatus, stripePaymentIntentId ?? null, orderId]
    );
  }

  async updateOrderPaymentByIntentId(stripePaymentIntentId: string, paymentStatus: Order['paymentStatus']): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET payment_status = $1 WHERE stripe_payment_intent_id = $2`,
      [paymentStatus, stripePaymentIntentId]
    );
  }

  // ── Config ─────────────────────────────────────────────────────────────

  async saveConfig(config: RestaurantConfig): Promise<RestaurantConfig> {
    await this.pool.query(
      `INSERT INTO restaurant_configs (user_id, name, tables_count)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET name = $2, tables_count = $3, updated_at = NOW()`,
      [config.userId, config.name, config.tables]
    );
    return config;
  }

  async getConfig(userId: UserId): Promise<RestaurantConfig | null> {
    const { rows } = await this.pool.query(
      `SELECT user_id, name, tables_count FROM restaurant_configs WHERE user_id = $1`,
      [userId]
    );
    if (rows.length === 0) return null;
    return { userId: rows[0].user_id, name: rows[0].name, tables: rows[0].tables_count };
  }

  // ── Row mapper ─────────────────────────────────────────────────────────

  private rowToDish(row: Record<string, unknown>): Dish {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      description: (row.description as string) ?? '',
      price: parseFloat(row.price as string),
      category: row.category as string,
      images: (row.images as string[]) ?? [],
      portionSize: (row.portion_size as string) ?? '',
      isARReady: (row.is_ar_ready as boolean) ?? false,
      arModelUrl: row.ar_model_url as string | undefined,
      modelGenerationStatus: (row.model_generation_status as Dish['modelGenerationStatus']) ?? 'pending',
      generationProgress: (row.generation_progress as number) ?? 0,
      geometricPrompt: (row.geometric_prompt as string) ?? undefined,
    };
  }
}

export const db = PostgresClient.getInstance();
