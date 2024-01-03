import { builder } from '../builder';
import { GraphQLError } from 'graphql';
import Postgres from 'postgres';
import { type User } from './user';

// builder.mutationField('sigIn', (t) =>
// 	t.fieldWithInput({
// 		description: `Mutação para autenticar e fazer login de um usuário.`
// 		input: {
// 			login: t.input.string({
// 				required: true,
// 				description: 'Email de login do usuário',
// 			}),
// 			password: t.input.string({
// 				required: true,
// 				description: 'Senha do usuário',
// 			}),
// 		},
// 		authScopes: {
// 			public: true
// 		},
// 		type: 'AuthPayload',
// 		resolve: async (_, {input}, {db, users}): Promise<AuthPayload> => {
// 			try {

// 			}
// 		}
// 	})
// );

builder.objectType('AuthPayload', {
	fields: (t) => ({
		token: t.exposeString('token'),
		user: t.field({
			type: 'User',
			nullable: true, // Only for test
			resolve: async (parent, _, ctx) => {
				console.log(`Parente on AuthPayload Resolver`, parent);

				return null;
			},
		}),
	}),
});

export type AuthPayload = {
	token: string;
	user: typeof User.$inferType;
};
