import { builder } from '../builder';
import Postgres from 'postgres';
import { GraphQLError } from 'graphql';
import { type NewUser } from '../db/user/schema';
import { createId } from '../lib';
import { eq } from 'drizzle-orm';

// Just For Developmnet Environmet and Helper - Will be deleted on production
builder.queryField('users', (t) =>
	t.field({
		description: `Lista de Usuários Registrados no Banco de Dados`,
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

// Just For Developmnet Environmet and Helper - Will be deleted on production
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
		resolve: async (
			_,
			{ input },
			{ db, users, currentUser }
		): Promise<any> => {
			console.log(currentUser);

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

/**
 * Etapas para criar um Usuario
 * - Receber os dados que o usuario vai digitar:
 * 1 - login
 * 2 - senha
 * 3 - username
 *
 * - Inser no banco de dados os seguintes dados
 * 1 - id, gerado automaticamente com o cuid2
 * 2 - login recebido pelo usuario
 * 3 - password, recebido pelo usuario mas sera encriptada para ser salvo no DB
 * 4 - username, recebido pelo usuario
 * 5 - avatar_url -> Funcao que sera criada posteriormente, neste momento sera gravado uma URL `padrao`
 */

builder.mutationField('createUser', (t) =>
	t.fieldWithInput({
		description: `Cria um novo usuário no sistema. É necessário fornecer informações como login, senha e nome de usuário (username), o qual deve ser único.`,
		input: {
			login: t.input.string({
				required: true,
				description: 'Nome de login do novo usuário',
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
			try {
				const newUser: NewUser = {
					id: createId(),
					username: input.username,
					login: input.login,
					password: await Bun.password.hash(input.password),
					avatarUrl: 'Default URL',
				};

				const sucessfullyCreatedUser = await db
					.insert(users)
					.values(newUser)
					.returning();

				return sucessfullyCreatedUser[0];
			} catch (e) {
				if (e instanceof Postgres.PostgresError) {
					console.error(
						'Erro ao criar usuário: Não foi possível concluir a operação.'
					);

					if (e.code === '23505')
						throw new GraphQLError(
							'O nome de usuário fornecido já está em uso. Por favor, escolha outro.',
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
		login: t.exposeString('login', {
			description: 'Nome de login do usuário',
		}),
		password: t.exposeString('password', {
			description: 'Senha do usuário',
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
