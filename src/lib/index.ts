import { init } from '@paralleldrive/cuid2';
import jwt from 'jsonwebtoken';

export const createId = init({
	length: 25,
});

export const verifyUser = (token: string) => {
	try {
		if (token) {
			console.log(`Token`, token);

			const user = jwt.verify(token, process.env.JWT_SECRET as string);

			console.log(`User on verifyUser`, user);

			return user;
		}
		return null;
	} catch (error) {
		return null;
	}
};
