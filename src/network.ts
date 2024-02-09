import defaults from 'defaults';
import md5 from 'md5';
import mime from 'mime-types';
import { access, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { exec as execSync } from 'node:child_process';
import { extname, join } from 'node:path';
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

// TODO: Should cache be split into a story / chapter
const getCachePath = (url: URL) => {
  const { href, pathname, protocol } = url;
  let ext = extname(pathname);
  if (protocol === 'data:') {
    const split = pathname.split(';');
    if (split.length > 0) {
      const newExt = mime.extension(split[0]);
      if (newExt) {
        ext = `.${newExt}`;
      }
    }
  }
  const filename = `${md5(href)}${ext}`;
  return join(cachePath, filename);
};

const getCache = async (file: string) => {
  try {
    await access(file, constants.R_OK);
    return String(await readFile(file));
  } catch (e) {
    // Skip
  }
  return '';
};

type CurlOptions = Partial<{
  append: string;
  cache: boolean;
}>;

const defaultCurlOptions: Required<CurlOptions> = {
  append: '',
  cache: true,
};

// cookie is the cf_clearance cookie
const curl = async (
  url: URL,
  _options?: CurlOptions,
): Promise<[string, string]> => {
  const options: Required<CurlOptions> = defaults(
    _options || {},
    defaultCurlOptions,
  );
  const { href } = url;
  const cacheFile = getCachePath(url);
  if (options.cache && cache) {
    const cached = await getCache(cacheFile);
    if (cached !== '') {
      debug(`Cache hit for ${href} at ${cacheFile}`);
      return [cached, cacheFile];
    }
    debug(`Cache miss for ${href}`);
  } else {
    debug(`Skip cache for ${href}`);
  }

  if (url.protocol === 'data:') {
    const matched = url.pathname.match(/^.*?;base64,(.*)$/);
    if (!matched) {
      return ['', cacheFile];
    }
    const data = Buffer.from(matched[1], 'base64');
    writeFile(cacheFile, data);
    debug(`Decoded base64 for ${href}`);
    return [String(data), cacheFile];
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

export { curl, getCachePath, setAgent, setCache, setCookie };
