import os from 'node:os';
import path from 'node:path';

const { XDG_DATA_HOME } = process.env;

const base = XDG_DATA_HOME
  ? path.join(XDG_DATA_HOME, 'fic-gen')
  : path.join(os.homedir(), '.fic-gen');

const data = path.join(base, 'data');

const cache = path.join(base, 'cache');

const curl = path.join(base, 'curl-impersonate', 'curl-impersonate-ff');

export { cache, curl, data };
