import { type Config } from 'drizzle-kit';

if (!process.env.DB_URL) {
	throw new Error('DATABASE_URL is missing');
}

export default {
	schema: './src/db/**/schema.ts',
	out: './src/db/migrations',
	driver: 'pg',
	dbCredentials: {
		connectionString: process.env.DB_URL as string,
	},
	verbose: true,
	strict: true,
} satisfies Config;
