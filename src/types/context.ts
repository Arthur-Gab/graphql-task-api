import { db } from '../db';
import { users } from '../db/user/schema';
import { todos } from '../db/todos/schema';

export type MyContext = {
	isLoggedIn: boolean;
	db: typeof db;
	users: typeof users;
	todos: typeof todos;
};
