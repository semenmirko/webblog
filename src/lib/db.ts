import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../../db/schema';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
