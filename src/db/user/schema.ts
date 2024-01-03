import { pgTable, varchar, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: varchar('user_id', { length: 25 }).primaryKey(),
	username: varchar('username', { length: 50 }).unique().notNull(),
	login: varchar('login', { length: 50 }).notNull(),
	password: text('password').notNull(),
	avatarUrl: text('avatar_url'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
