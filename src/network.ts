import { constants } from 'fs';
import { access, readFile } from 'fs/promises';
import md5 from 'md5';
import path from 'path';
import { exec as execSync } from 'child_process';
import { promisify } from 'util';

import { cache as cachePath, curl as curlPath } from './utils/paths.js';
import { debug, error } from './utils/log.js';

const exec = promisify(execSync);

let agent = '';
let cache = true;
let cookie = '';

const setCache = (_cache: boolean) => {
  cache = _cache;
};

const setAgent = (_agent: string) => {
  agent = _agent;
};

const setCookie = (_cookie: string) => {
  cookie = _cookie;
};

const getCachePath = (url: URL) => path.join(cachePath, md5(url.href));

const getCache = async (file: string) => {
  try {
    await access(file, constants.R_OK);
    return String(await readFile(file));
  } catch {
    // Skip
  }
  return '';
};

// cookie is the cf_clearance cookie
const curl = async (url: URL, options = ''): Promise<[string, string]> => {
  const cacheFile = getCachePath(url);
  if (cache) {
    const cached = await getCache(cacheFile);
    if (cached !== '') {
      debug(`Cache hit for ${url.href} at ${cacheFile}`);
      return [cached, cacheFile];
    }
    debug(`Cache miss for ${url.href}`);
  } else {
    debug(`Skip cache for ${url.href}`);
  }

  const cmd = `${curlPath} -A '${agent}'${
    cookie ? ` -H 'Cookie: ${cookie}'` : ''
  } -s -o "${cacheFile}" ${options} -- "${url}"`;

  debug(cmd);

  const { stderr } = await exec(cmd);
  if (stderr) {
    error(stderr);
  }

  return [await getCache(cacheFile), cacheFile];
};

export { curl, setAgent, setCache, setCookie };
