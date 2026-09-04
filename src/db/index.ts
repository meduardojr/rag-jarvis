// Neon Database Client (server-side only)
// This module is lazy-loaded to avoid build-time connection attempts
import { neon } from '@neondatabase/serverless';

type SqlClient = ReturnType<typeof neon>;

let _sql: SqlClient | null = null;

export function getSql(): SqlClient {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Export sql as a getter that returns the client
// Usage in routes: const { sql } = require('@/db');
// Then: await sql`SELECT * FROM ...`
export const sql = new Proxy({} as SqlClient, {
  get(_target, prop) {
    const client = getSql();
    if (prop === 'then') return undefined;
    return (client as any)[prop];
  },
});

// IMPORTANT: Only use this in server-side code (API routes, server actions, server components).
// NEVER import @neondatabase/serverless in client-side React components.
