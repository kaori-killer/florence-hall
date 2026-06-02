import { query, withTransaction } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type User = { id: number; email: string; name: string };

export async function signup(input: {
  email: string;
  name: string;
  password: string;
}): Promise<User> {
  const hash = await hashPassword(input.password);
  return withTransaction(async (client) => {
    const existing = await client.query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1",
      [input.email],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      throw new Error("이미 사용 중인 이메일입니다.");
    }
    const inserted = await client.query<User>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [input.email, input.name, hash],
    );
    return inserted.rows[0];
  });
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<User | null> {
  const rows = await query<{
    id: number;
    email: string;
    name: string;
    password_hash: string;
  }>(
    "SELECT id, email, name, password_hash FROM users WHERE email = $1",
    [input.email],
  );
  const user = rows[0];
  if (!user) return null;
  const ok = await verifyPassword(input.password, user.password_hash);
  return ok ? { id: user.id, email: user.email, name: user.name } : null;
}
