import { isDebugMode } from './debugMode';

// Log wrapper to handle debug only messages
const _log = (
  msg: string,
  mode: 'error' | 'log' | 'warn',
  debugOnly = false,
) => {
  if (!debugOnly || (debugOnly && isDebugMode())) {
    // eslint-disable-next-line no-console
    console[mode](msg);
  }
};

const debug = (msg: string) => _log(msg, 'log', true);
const error = (msg: string) => _log(msg, 'error');
const log = (msg: string) => _log(msg, 'log');
// const warn = (msg: string, debugOnly = false) => _log(msg, 'warn', debugOnly);

export { debug, error, log };
