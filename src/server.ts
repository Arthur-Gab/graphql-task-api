import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { schema } from './schema';

import { db } from './db';
import { users } from './db/user/schema';
import { todos } from './db/todos/schema';

import { type MyContext } from './types/context';

import { verifyUser } from './lib';

import { GraphQLError } from 'graphql';

const startApolloServer = async () => {
	try {
		const server = new ApolloServer<MyContext>({
			schema,
			includeStacktraceInErrorResponses: false,
		});

		const PORT = Number(process.env.API_PORT) || 4000;

		const { url } = await startStandaloneServer(server, {
			listen: {
				port: PORT,
			},
			context: async ({ req, res }) => {
				const token = req.headers.authorization || '';

				return {
					currentUser: verifyUser(token),
					db,
					users,
					todos,
				};
			},
		});

		console.info(`Server running on ${new URL(url)}`);
	} catch (e) {
		console.log(`Something went Wrong`);
		console.error(e);
		process.exit(1);
	}
};

startApolloServer();
