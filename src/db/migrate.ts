import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationClient } from './client';

(async () => {
	try {
		if (!process.env.DB_URL) {
			throw new Error('DB_URL is missing');
		}

		console.log(`Starting Migration`);

		await migrate(drizzle(migrationClient), {
			migrationsFolder: './src/db/migrations',
		});

		console.log(`Sucessfuly Migrated`);
	} catch (e) {
		console.log(`Migration Failed`);
		console.error(e);
		process.exit(1);
	}
})();
