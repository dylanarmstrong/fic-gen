import { exec as execSync } from 'child_process';
import { promisify } from 'util';

import { curl as curlPath } from './utils/paths.js';
import { debug, error } from './utils/log.js';

const exec = promisify(execSync);

let agent = '';
let cookie = '';

const setAgent = (_agent: string) => {
  agent = _agent;
};

const setCookie = (_cookie: string) => {
  cookie = _cookie;
};

// cookie is the cf_clearance cookie
const curl = async (url: string, options: string): Promise<string> => {
  const cmd = `${curlPath} -A '${agent}'${
    cookie ? ` -H 'Cookie: ${cookie}'` : ''
  } -s "${url}" ${options}`;

  debug(cmd);

  const { stderr, stdout } = await exec(cmd);
  if (stderr) {
    error(stderr);
  }
  return stdout;
};

export { curl, setAgent, setCookie };
