-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- keeping text to match existing 'u_...' format for now, or could use UUID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- Storing plain text for now based on existing code, should be hashed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configs Table
CREATE TABLE IF NOT EXISTS restaurant_configs (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    name TEXT NOT NULL,
    tables_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dishes Table
CREATE TABLE IF NOT EXISTS dishes (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    images TEXT[], -- Array of image URLs
    portion_size TEXT,
    is_ar_ready BOOLEAN DEFAULT false,
    ar_model_url TEXT,
    model_generation_status TEXT,
    generation_progress INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    table_number INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'preparing', 'ready', 'served', 'paid'
    total DECIMAL(10, 2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table (Junction table for Order <-> Dish)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES orders(id),
    dish_id TEXT REFERENCES dishes(id),
    quantity INTEGER NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL -- Snapshot of price
);
