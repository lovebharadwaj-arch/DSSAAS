import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/postragesql.ts";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await pool.query(
    "SELECT id FROM public.users WHERE email = $1",
    [normalizedEmail],
  );

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO public.users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name.trim(), normalizedEmail, passwordHash],
  );

  return result.rows[0];
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query<UserRecord>(
    `SELECT id, name, email, password_hash
     FROM public.users
     WHERE email = $1`,
    [normalizedEmail],
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = jwt.sign({ email: user.email }, getJwtSecret(), {
    subject: user.id,
    expiresIn: "600m",
    issuer: "data-analytics-saas",
    audience: "data-analytics-saas-api",
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600000,
  };
}
