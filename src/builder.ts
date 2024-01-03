import SchemaBuilder from '@pothos/core';
import { DateTimeISOResolver } from 'graphql-scalars';
import WithInputPlugin from '@pothos/plugin-with-input';

import { type User } from './db/user/schema';
import { type Todo } from './db/todos/schema';

import { type MyContext } from './types/context';

import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import { type AuthPayload } from './types/auth';

export const builder = new SchemaBuilder<{
	Objects: {
		User: User;
		Todo: Todo;
		AuthPayload: AuthPayload;
	};
	Scalars: {
		ID: { Input: string; Output: string };
		Date: { Input: Date; Output: Date };
	};
	Context: MyContext;
	AuthScopes: {
		isUserLoggedIn: boolean;
		public: boolean;
	};
}>({
	plugins: [ScopeAuthPlugin, WithInputPlugin],
	authScopes: async (context) => {
		console.log(context.isLoggedIn);

		return {
			public: true,
			isUserLoggedIn: context.isLoggedIn,
		};
	},
});

builder.addScalarType('Date', DateTimeISOResolver, {
	description: 'Data em formato ISO 8601 sem Time Zone',
});

builder.queryType({});
builder.mutationType({});
