import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { queryClient } from './client';

export const db: PostgresJsDatabase = drizzle(queryClient);
