/**
 * NOTE(joel): This file...
 */
import { setupServer } from 'msw/node';
import { handlers } from './msw-handler';

export const server = setupServer(...handlers);
