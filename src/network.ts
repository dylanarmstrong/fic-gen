import { constants } from 'fs';
import { access, readFile, writeFile } from 'fs/promises';
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

const checkCache = async (url: URL) => {
  const file = getCachePath(url);
  try {
    await access(file, constants.R_OK);
    return String(await readFile(file));
  } catch {
    // Skip
  }
  return false;
};

const writeCache = async (url: URL, data: string) => {
  const file = getCachePath(url);
  await writeFile(file, data);
};

// cookie is the cf_clearance cookie
const curl = async (url: URL, options = ''): Promise<[string, string]> => {
  const cacheFile = getCachePath(url);
  if (cache) {
    const cached = await checkCache(url);
    if (cached !== false) {
      debug(`Cache hit for ${url.href}`);
      return [cached, cacheFile];
    }
    debug(`Cache miss for ${url.href}`);
  }

  const cmd = `${curlPath} -A '${agent}'${
    cookie ? ` -H 'Cookie: ${cookie}'` : ''
  } -s "${url}" ${options} -o ${cacheFile}`;

  debug(cmd);

  const { stderr, stdout } = await exec(cmd);
  if (stderr) {
    error(stderr);
  } else {
    await writeCache(url, stdout);
  }
  return [stdout, cacheFile];
};

export { curl, setAgent, setCache, setCookie };
