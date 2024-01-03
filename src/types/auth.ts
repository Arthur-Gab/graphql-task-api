import { builder } from '../builder';
import { GraphQLError } from 'graphql';
import { type User } from '../db/user/schema';

import { eq } from 'drizzle-orm';

import { isEmailValidy } from '../lib';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

builder.mutationField('sigIn', (t) =>
	t.fieldWithInput({
		description: `Mutação para autenticar e fazer login de um usuário.`,
		input: {
			email: t.input.string({
				required: true,
				description: 'Email de login do usuário',
			}),
			password: t.input.string({
				required: true,
				description: 'Senha do usuário',
			}),
		},
		authScopes: {
			public: true,
		},
		type: 'AuthPayload',
		resolve: async (_, { input }, { db, users }): Promise<AuthPayload> => {
			// Validar o email
			const isInputEmailValid = isEmailValidy(input.email);

			if (!isInputEmailValid.sucess) {
				throw new GraphQLError(
					isInputEmailValid.error?.message as string,
					{
						extensions: {
							code: isInputEmailValid.error?.code as string,
						},
					}
				);
			}

			// Recuperar o email e senha do usuario
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.email, input.email));

			// Veriricar se a senha digitada e a correta
			const isPasswordCorrectly = await bcrypt.compare(
				input.password,
				user.password
			);

			if (!isPasswordCorrectly) {
				throw new GraphQLError(
					'As credenciais de e-mail/senha estão incorretas. Por favor, verifique e tente novamente.'
				);
			}

			// Enviar o Token ao cliente
			const token = jwt.sign(
				{
					id: user.id,
				},
				process.env.JWT_SECRET as string,
				{
					expiresIn: '1h',
				}
			);

			const { password, ...userWithoutPasswordField } = user;

			return {
				token,
				user: userWithoutPasswordField,
			};
		},
	})
);

builder.objectType('AuthPayload', {
	description:
		'Objeto que representa o resultado de uma autenticação bem-sucedida.',
	fields: (t) => ({
		token: t.exposeString('token', {
			description: 'Token contendo o ID do usuário.',
		}),
		user: t.field({
			type: 'User',
			description: 'Usuário relacionado ao token.',
			resolve: async (parent): Promise<any> => parent.user,
		}),
	}),
});

export type AuthPayload = {
	token: string;
	user: Omit<User, 'password'>;
};
