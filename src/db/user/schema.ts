import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: varchar('user_id', { length: 25 }).primaryKey(),
	email: text('email').notNull().unique(), // login -> email
	password: text('password').notNull(),
	username: varchar('username', { length: 50 }).notNull(),
	avatarUrl: text('avatar_url'),
});

// Subescrever o tipo de password
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
