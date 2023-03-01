import path from 'path';
import { exec as execSync } from 'child_process';
import { promisify } from 'util';

import { error, log } from './utils/log.js';

const { url: importUrl } = import.meta;
const importUrls = importUrl.split(path.sep);
// Remove file:// and src/network.js
const base = `/${importUrls.slice(3, importUrls.length - 2).join(path.sep)}`;

const curlPath = path.join(base, 'curl-impersonate', 'curl-impersonate-ff');

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

  log(cmd, true);

  const { stderr, stdout } = await exec(cmd);
  if (stderr) {
    error(stderr);
  }
  return stdout;
};

export { setAgent, setCookie, curlPath, curl };
