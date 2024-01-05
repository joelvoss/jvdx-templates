import { TextEncoder } from 'util';

// NOTE(joel): Since Jest v28 the jsdom environment is missing the
// TextEncoder class we retrofit here.
global.TextEncoder = TextEncoder;
