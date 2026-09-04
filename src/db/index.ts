// Neon Database Client (server-side only)
// Lazy-init wrapper around neon() to avoid build-time connection attempts
import { neon } from '@neondatabase/serverless';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlResult = Promise<any[]>;

let _sql: ((strings: TemplateStringsArray, ...values: unknown[]) => SqlResult) | null = null;

function getClient(): (strings: TemplateStringsArray, ...values: unknown[]) => SqlResult {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const neonClient = neon(process.env.DATABASE_URL);
    // Wrap to ensure we always return an array
    _sql = (strings: TemplateStringsArray, ...values: unknown[]): SqlResult => {
      return neonClient(strings, ...values) as SqlResult;
    };
  }
  return _sql;
}

// Tagged template function - lazily initializes the client
// Usage: await sql`SELECT * FROM users`
export function sql(strings: TemplateStringsArray, ...values: unknown[]): SqlResult {
  return getClient()(strings, values);
}

// IMPORTANT: Only use this in server-side code (API routes, server actions, server components).
// NEVER import @neondatabase/serverless in client-side React components.
