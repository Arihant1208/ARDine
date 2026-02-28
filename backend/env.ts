/**
 * Environment loader — must be imported FIRST in every entry-point
 * (server.ts, worker.ts, db/setup.ts, db/seed.ts) so that process.env
 * is populated before any module reads it at import time.
 */
import { existsSync } from 'fs';
import { config as loadEnv } from 'dotenv';

// Priority: ENV_FILE env var > .env.local > .env
const envFile = process.env.ENV_FILE
  ?? (existsSync('.env.local') ? '.env.local' : '.env');
loadEnv({ path: envFile });

// Back-compat: existing AI client checks API_KEY
if (!process.env.API_KEY && process.env.GEMINI_API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}
