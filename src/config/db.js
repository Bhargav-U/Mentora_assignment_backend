import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error.message);
});

export const query = (text, params = []) => pool.query(text, params);

export const testDbConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("Database connected successfully.");
  } finally {
    client.release();
  }
};

export default pool;