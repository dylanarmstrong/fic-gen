import defaults from 'defaults';
import md5 from 'md5';
import path from 'node:path';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { exec as execSync } from 'node:child_process';
import { promisify } from 'node:util';

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

type CurlOptions = Partial<{
  append: string;
  cache: boolean;
}>;

const defaultCurlOptions = {
  append: '',
  cache: true,
};

// cookie is the cf_clearance cookie
const curl = async (
  url: URL,
  _options?: CurlOptions,
): Promise<[string, string]> => {
  const options = defaults(_options, defaultCurlOptions);
  const cacheFile = getCachePath(url);
  if (options.cache && cache) {
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
  } -s -o "${cacheFile}" ${options.append} -- "${url}"`;

  debug(cmd);

  const { stderr } = await exec(cmd);
  if (stderr) {
    error(stderr);
  }

  return [await getCache(cacheFile), cacheFile];
};

export { curl, setAgent, setCache, setCookie };
