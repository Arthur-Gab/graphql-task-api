import { init } from '@paralleldrive/cuid2';
import jwt from 'jsonwebtoken';
import z from 'zod';

export const createId = init({
	length: 25,
});

export const verifyUser = (token: string) => {
	try {
		if (token) {
			const user = jwt.verify(token, process.env.JWT_SECRET as string);

			return user;
		}
		return false;
	} catch (error) {
		return false;
	}
};

export const isEmailValidy = (
	email: string
): {
	sucess: boolean;
	error?: {
		message: string;
		code: string;
	};
} => {
	const isEmailValid = z
		.string()
		.email({
			message: `Formato de e-mail inválido. Por favor, forneça um e-mail válido.`,
		})
		.safeParse(email);

	if (!isEmailValid.success) {
		return {
			sucess: false,
			error: {
				message: isEmailValid.error.issues[0].message,
				code: isEmailValid.error.issues[0].code,
			},
		};
	}

	return {
		sucess: true,
	};
};
