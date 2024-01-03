import postgres from 'postgres';

export const migrationClient = postgres(process.env.DB_URL as string, {
	max: 1,
});

export const queryClient = postgres(process.env.DB_URL as string);
