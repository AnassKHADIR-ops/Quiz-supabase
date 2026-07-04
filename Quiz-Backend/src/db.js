import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const needsSSL =
  process.env.DATABASE_URL?.includes("neon.tech") ||
  process.env.DATABASE_URL?.includes("railway") ||
  process.env.DATABASE_URL?.includes("render.com") ||
  process.env.DATABASE_URL?.includes("sslmode=require");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSSL ? { rejectUnauthorized: false } : false,
});

export async function query(text, params) {
  return pool.query(text, params);
}
