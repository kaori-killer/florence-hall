import { config } from "dotenv";
import path from "node:path";

config({
  path: path.resolve(__dirname, "../../.env.test"),
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for tests (.env.test)");
}
if (!process.env.DATABASE_URL.includes("florence_test")) {
  throw new Error(
    "Refusing to run tests against non-test database. DATABASE_URL must point at florence_test.",
  );
}
