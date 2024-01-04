import { builder } from '../builder';
import { GraphQLError } from 'graphql';
import Postgres from 'postgres';
import type { NewTodo } from '../db/todos/schema';
import { createId } from '../lib';
import { eq } from 'drizzle-orm';

builder.mutationField('createTodo', (t) =>
	t.fieldWithInput({
		description: `Cria uma nova tarefa associada a um usuário. É necessário fornecer um ID de usuário válido e, no mínimo, um título para a tarefa. Outros campos opcionais incluem a descrição da tarefa e se ela está completa ou não.`,
		authScopes: {
			isUserLoggedIn: true,
		},
		input: {
			userId: t.input.id({
				required: true,
				description: 'ID do usuário associado à tarefa',
			}),
			title: t.input.string({
				required: true,
				description: 'Título da nova tarefa',
			}),
			description: t.input.string({
				description: 'Descrição detalhada da tarefa',
			}),
			isChecked: t.input.boolean({
				description: 'Indica se a tarefa está concluída ou não',
				defaultValue: false,
			}),
		},
		type: 'Todo',
		resolve: async (_, { input }, { db, todos }): Promise<any> => {
			try {
				const newTodo: NewTodo = {
					id: createId(),
					userId: input.userId,
					title: input.title,
					description: input.description,
					isChecked: input.isChecked as boolean,
				};

				const sucessfullyCreatedTodo = await db
					.insert(todos)
					.values(newTodo)
					.returning();

				console.log(sucessfullyCreatedTodo[0]);

				return sucessfullyCreatedTodo[0];
			} catch (e) {
				if (e instanceof Postgres.PostgresError) {
					console.error(
						'Erro ao deletar usuário: Não foi possível concluir a operação.'
					);

					if (e.code === '23502')
						throw new GraphQLError(
							'O ID de usuário informado não é válido. Tente outro.',
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

builder.mutationField('updateTodo', (t) =>
	t.fieldWithInput({
		description: `Alterar o título, a descrição e o estado (completada ou não) de uma tarefa no sistema. É necessário fornecer um ID de tarefa válido.`,
		authScopes: {
			isUserLoggedIn: true,
		},
		input: {
			todoId: t.input.id({
				required: true,
				description: 'ID da tarefa a ser modificada',
			}),
			isChecked: t.input.boolean({
				description: 'Novo estado da tarefa concluída ou não',
			}),
			title: t.input.string({ description: 'Novo título da tarefa' }),
			description: t.input.string({
				description: 'Nova descrição da tarefa',
			}),
		},
		type: 'Todo',
		resolve: async (
			_,
			{ input: { todoId, ...valuesToUpdate } },
			{ db, todos }
		): Promise<any> => {
			// Retirar campos recebidos como nullus
			const valuesToUpdateWithoutPossibleNullValues = Object.entries(
				valuesToUpdate
			).reduce((acc, keyAndValue) => {
				const [key, value] = keyAndValue;

				if (value !== null) {
					return Object.assign(acc, {
						[key]: value,
					});
				}

				return acc;
			}, {});

			// Validar se possui campos para alterar
			const valuesToUpdateIsNotEmpty =
				Object.values(valuesToUpdateWithoutPossibleNullValues).map(
					(value) => value
				).length > 0;

			if (!valuesToUpdateIsNotEmpty)
				throw new GraphQLError(
					'Nenhum campo para alteração informado. Por favor, informe um novo título, descrição ou estado para modificar a tarefa.',
					{
						extensions: {
							code: 'BAD_USER_INPUT',
						},
					}
				);

			// ALterar os dados de fato
			const updatedTodo = await db
				.update(todos)
				.set({
					...valuesToUpdateWithoutPossibleNullValues,
					updatedAt: new Date(),
				})
				.where(eq(todos.id, todoId))
				.returning();

			if (!updatedTodo[0])
				throw new GraphQLError(
					'O ID da tarefa informado não é válido. Tente outro.',
					{
						extensions: {
							code: 'BAD_USER_INPUT',
						},
					}
				);

			return updatedTodo[0];
		},
	})
);

builder.mutationField('deleteTodo', (t) =>
	t.fieldWithInput({
		description: `Remove uma tarefa do sistema. É necessário fornecer um ID de tarefa válido.`,
		authScopes: {
			isUserLoggedIn: true,
		},
		input: {
			todoId: t.input.id({
				required: true,
				description: 'ID da tarefa a ser deletada.',
			}),
		},
		type: 'Boolean',
		resolve: async (_, { input }, { db, todos }): Promise<boolean> => {
			const deletedTodo = await db
				.delete(todos)
				.where(eq(todos.id, input.todoId))
				.returning();

			if (!deletedTodo[0]) {
				throw new GraphQLError(
					'O ID da tarefa informado não é válido. Tente outro.',
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

builder.objectType('Todo', {
	description: 'Representa uma tarefa a ser realizada',
	fields: (t) => ({
		id: t.exposeID('id', { description: `Identificador único da tarefa` }),
		userId: t.exposeID('userId', {
			description: 'Identificador do usuário a quem essa tarefa pertence',
		}),
		title: t.exposeString('title', { description: 'Título da tarefa' }),
		description: t.exposeString('description', {
			nullable: true,
			description: 'Descrição detalhada da tarefa',
		}),
		isChecked: t.exposeBoolean('isChecked', {
			description: 'Indica se a tarefa foi concluída ou não',
		}),
		createdAt: t.field({
			type: 'Date',
			description: 'Data de criação da tarefa no formato ISO 8601',
			resolve: (parent) => parent.createdAt,
		}),
		updatedAt: t.field({
			type: 'Date',
			description:
				'Data da última alteração na tarefa em formato ISO 8601. Pode ser igual à data de criação em algum momento.',
			resolve: (parent) => parent.updatedAt,
		}),
	}),
});
