import { builder } from '../builder';
import { createId, isEmailValidy } from '../lib';
import { GraphQLError } from 'graphql';
import Postgres from 'postgres';
import bcrypt from 'bcrypt';

import { eq } from 'drizzle-orm';

import { type NewUser } from '../db/user/schema';
/**
 *
 * DELETE BEFORE PRODUCTION
 *
 */
builder.queryField('users', (t) =>
	t.field({
		description: `Lista de Usuários Registrados no Banco de Dados`,
		authScopes: {
			public: true,
		},
		type: ['User'],
		nullable: {
			list: false,
			items: true,
		},
		resolve: async (_, __, { db, users }) => {
			return db.select().from(users) || [];
		},
	})
);

// Unique Query of Schema
builder.queryField('user', (t) =>
	t.fieldWithInput({
		description: `Obter usuário por ID no banco de dados`,
		input: {
			userId: t.input.id({
				required: true,
				description: 'ID único do usuário',
			}),
		},
		type: 'User',
		resolve: async (_, { input }, { db, users }): Promise<any> => {
			const selectedUser = await db
				.select()
				.from(users)
				.where(eq(users.id, input.userId));

			if (!selectedUser[0])
				throw new GraphQLError(
					'O ID informado nao esta registrado no BD',
					{
						extensions: {
							code: 'BAD_USER_INPUT',
						},
					}
				);

			return selectedUser[0];
		},
	})
);

builder.mutationField('createUser', (t) =>
	t.fieldWithInput({
		description: `Cria um novo usuário no sistema. É necessário fornecer informações como login, senha e nome de usuário (username), o qual deve ser único.`,
		authScopes: {
			public: true,
		},
		input: {
			email: t.input.string({
				required: true,
				description: 'Email de login do novo usuário',
			}),
			password: t.input.string({
				required: true,
				description: 'Senha do novo usuário',
			}),
			username: t.input.string({
				required: true,
				description: 'Nome de usuário único para o novo usuário',
			}),
		},
		type: 'User',
		resolve: async (_, { input }, { db, users }): Promise<any> => {
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

			try {
				const newUser: NewUser = {
					id: createId(),
					username: input.username,
					email: input.email,
					password: await bcrypt.hashSync(input.password, 10),
					avatarUrl: 'Default URL',
				};

				const sucessfullyCreatedUser = await db
					.insert(users)
					.values(newUser)
					.returning();

				const { password, ...unsensitivyFields } =
					sucessfullyCreatedUser[0];

				console.log(unsensitivyFields);

				return unsensitivyFields;
			} catch (e) {
				if (e instanceof Postgres.PostgresError) {
					console.error(
						'Erro ao criar usuário: Não foi possível concluir a operação.'
					);

					if (e.code === '23505')
						throw new GraphQLError(
							'O email fornecido já está em uso. Por favor, escolha outro.',
							{
								extensions: {
									code: 'BAD_USER_INPUT',
								},
							}
						);
				}

				console.error(e);
				throw new Error('Um error inesperado ocorreu');
			}
		},
	})
);

builder.mutationField('deleteUser', (t) =>
	t.fieldWithInput({
		description: `Remove um usuário do sistema. É necessário fornecer um ID de usuário válido.`,
		input: {
			userId: t.input.id({
				required: true,
				description: 'ID único do usuário',
			}),
		},
		type: 'Boolean',
		resolve: async (_, { input }, { db, users }): Promise<any> => {
			const deletedUser = await db
				.delete(users)
				.where(eq(users.id, input.userId))
				.returning();

			if (!deletedUser[0]) {
				throw new GraphQLError(
					'O ID de usuário informado não é válido. Tente outro.',
					{
						extensions: {
							code: 'BAD_USER_INPUT',
						},
					}
				);
			}

			return true;
		},
	})
);

builder.mutationField('updateUsername', (t) =>
	t.fieldWithInput({
		description: `Altera o nome de usuário (username) de um usuário. É necessário fornecer um ID de usuário válido e um novo nome de usuário que não tenha sido registrado por outro usuário.`,
		input: {
			userId: t.input.id({
				required: true,
				description: 'ID único do usuário',
			}),
			username: t.input.string({
				required: true,
				description: 'Novo nome de usuário escolhido pelo usuário',
			}),
		},
		type: 'User',
		resolve: async (_, { input }, { db, users }): Promise<any> => {
			try {
				const updatedUser = await db
					.update(users)
					.set({ username: input.username })
					.where(eq(users.id, input.userId))
					.returning();

				if (!updatedUser[0]) {
					throw new Error('O ID informado nao esta registrado no BD');
				}

				console.log(updatedUser);
			} catch (e) {
				if (e instanceof Postgres.PostgresError) {
					if (e.code === '23505') {
						throw new GraphQLError(
							'Este nome de usuário já está em uso. Tente Outro.',
							{
								extensions: {
									code: 'BAD_USER_INPUT',
								},
							}
						);
					}
				}

				// Lidar com o throw error do try{}
				if (e instanceof Error)
					throw new GraphQLError(e.message, {
						extensions: {
							code: 'BAD_USER_INPUT',
						},
					});
			}
		},
	})
);

export const User = builder.objectType('User', {
	description: 'Representa um usuário no sistema',
	fields: (t) => ({
		id: t.exposeID('id', { description: 'Identificador único do usuário' }),
		username: t.exposeString('username', {
			description: 'Nome de usuário do usuário',
		}),
		email: t.exposeString('email', {
			description: 'Email do usuário',
		}),
		password: t.exposeString('password', {
			description: 'Senha do usuário',
			nullable: true,
		}),
		avatarUrl: t.exposeString('avatarUrl', {
			nullable: true,
			description: 'URL do avatar do usuário',
		}),
		todoList: t.field({
			description: 'Lista de tarefas associadas a este usuário.',
			type: ['Todo'],
			nullable: {
				list: false,
				items: true,
			},
			resolve: async (parent, _, { db, todos }): Promise<any> => {
				const userTodosList = db
					.select()
					.from(todos)
					.where(eq(todos.userId, parent.id));

				return userTodosList || [];
			},
		}),
	}),
});
