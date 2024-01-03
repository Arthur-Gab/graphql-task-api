import { builder } from './builder';

// Import All Models here
import './model/user';
import './model/todo';

export const schema = builder.toSchema({});
