import {
	boolean,
	pgTable,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';
import { users } from '../user/schema';
import { sql } from 'drizzle-orm';

export const todos = pgTable('todos', {
	id: varchar('todo_id', { length: 25 }).primaryKey(),
	userId: varchar('user_id', { length: 25 })
		.notNull()
		.references(() => users.id),
	title: text('title').notNull(),
	description: text('description'),
	isChecked: boolean('is_checked').notNull().default(false),
	createdAt: timestamp('created_at')
		.notNull()
		.default(sql`LOCALTIMESTAMP`),
	updatedAt: timestamp('updated_at')
		.notNull()
		.default(sql`LOCALTIMESTAMP CHECK(updated_at >= created_at)`),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
