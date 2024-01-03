import { db } from '../db';
import { users } from '../db/user/schema';
import { todos } from '../db/todos/schema';
import { type JwtPayload } from 'jsonwebtoken';

export type MyContext = {
	currentUser: string | JwtPayload | null;
	db: typeof db;
	users: typeof users;
	todos: typeof todos;
};
