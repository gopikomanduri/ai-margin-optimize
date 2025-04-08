import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Create database connection using environment variables
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

console.log('Database connection initialized');