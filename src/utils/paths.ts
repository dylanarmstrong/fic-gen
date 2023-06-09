import os from 'node:os';
import { join } from 'node:path';

const { XDG_DATA_HOME } = process.env;

const base = XDG_DATA_HOME
  ? join(XDG_DATA_HOME, 'fic-gen')
  : join(os.homedir(), '.fic-gen');

const data = join(base, 'data');

const cache = join(base, 'cache');

const curlHome = join(base, 'curl-impersonate');

const curl = join(curlHome, 'curl-impersonate-ff');

export { cache, curl, curlHome, data };
