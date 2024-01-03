import { builder } from '../builder';
import { User } from './user';

// builder.objectType('AuthPayload', {
// 	fields: (t) => ({

// 	})
// })

export type AuthPayload = {
	token: string;
	user: typeof User.$inferType;
};
