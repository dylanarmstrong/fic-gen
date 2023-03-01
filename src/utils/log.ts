import { isDebugMode } from './debugMode.js';

// Log wrapper to handle debug only messages
const _log = (
  msg: string,
  mode: 'error' | 'log' | 'warn',
  debugOnly: boolean,
) => {
  if (!debugOnly || (debugOnly && isDebugMode())) {
    // eslint-disable-next-line no-console
    console[mode](msg);
  }
};

const error = (msg: string, debugOnly = false) => _log(msg, 'error', debugOnly);
const log = (msg: string, debugOnly = false) => _log(msg, 'log', debugOnly);
// const warn = (msg: string, debugOnly = false) => _log(msg, 'warn', debugOnly);

export { error, log };
