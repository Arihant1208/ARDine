import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.join(__dirname, '../../.env.local') });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in .env.local");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Running migrations...");
        await pool.query(schemaSql);
        console.log("Migrations completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

runMigrations();
