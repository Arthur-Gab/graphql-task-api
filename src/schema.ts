import { builder } from './builder';

// Import All Models here
import './types/user';
import './types/todo';
import './types/auth';

export const schema = builder.toSchema({});
