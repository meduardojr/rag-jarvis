import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = '30m'; // 30 minutes

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function createSession(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifySession(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    return payload;
  } catch (error) {
    return null;
  }
}

// Helper to check session from cookies
export function getSessionFromRequest(request: Request): { userId: number } | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => c.trim().split('=')).map(([k, v]) => [k, decodeURIComponent(v)])
  );
  const token = cookies['jarvis-session'];
  if (!token) return null;
  return verifySession(token);
}

// Get the password hash from the database
export async function getPasswordHash(): Promise<string | null> {
  const result = await sql`SELECT password_hash FROM app_settings LIMIT 1`;
  if (result.length === 0) {
    return null;
  }
  return result[0].password_hash;
}

// Set the password hash (for initial setup or changing password)
export async function setPasswordHash(hashedPassword: string): Promise<void> {
  // We assume there is only one row in app_settings
  await sql`
    INSERT INTO app_settings (password_hash)
    VALUES (${hashedPassword})
    ON CONFLICT (id) DO UPDATE
    SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP;
  `;
}