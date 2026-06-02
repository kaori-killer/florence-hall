import { config } from "dotenv";
import path from "node:path";

config({
  path: path.resolve(__dirname, "../../.env.test"),
  override: true,
});

export default async function teardown(): Promise<void> {
  const { pool } = await import("@/lib/db");
  await pool.end();
}
